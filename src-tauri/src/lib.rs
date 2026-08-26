// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use base64::{engine::general_purpose::STANDARD, Engine as _};
#[cfg(not(debug_assertions))]
use portpicker::pick_unused_port;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, TcpListener};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

macro_rules! eprintln {
    ($($arg:tt)*) => {{
        let message = $crate::sanitize_log_message(&format!($($arg)*));
        std::eprintln!("{}", message);
        $crate::append_log_line(format_args!("{}", message));
    }};
}

#[cfg(not(debug_assertions))]
use tauri::utils::config::FrontendDist;
#[cfg(not(debug_assertions))]
use tauri::utils::config_v1::WindowUrl;

use tauri::{Emitter, Manager};

#[cfg(target_os = "macos")]
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
#[cfg(target_os = "macos")]
use rand::{rngs::OsRng, RngCore};

#[cfg(target_os = "macos")]
mod macos_media;
#[cfg(target_os = "windows")]
mod windows_media;
#[cfg(target_os = "linux")]
mod linux_media;

mod audio;
mod process_memory;
mod discord_rpc;
mod equalizer;
mod opus_source;
mod lastfm;

/// Keyring service for storing credentials
const KEYRING_SERVICE: &str = "com.pant0x.ambermusic";

/// Durable settings store
const APP_SETTINGS_FILE_NAME: &str = "settings-v1.json";

/// Default cache max bytes (1GB)
const DEFAULT_CACHE_MAX_BYTES: u64 = 1 * 1024 * 1024 * 1024;
const CURRENT_LOG_FILE_NAME: &str = "current.log";

static APP_LOG_FILE: OnceLock<Mutex<Option<File>>> = OnceLock::new();

/// The live session cookie for YouTube Music (if using cookie-based auth)
#[derive(Default)]
struct CookieJarState {
    cookie: Option<String>,
    persisted_at: Option<Instant>,
}

struct YoutubeCookieJar(Mutex<CookieJarState>);

fn parse_cookie_header(header: &str) -> Vec<(String, String)> {
    header
        .split(';')
        .filter_map(|part| part.trim().split_once('='))
        .map(|(name, value)| (name.trim().to_string(), value.trim().to_string()))
        .collect()
}

fn serialize_cookie_pairs(pairs: &[(String, String)]) -> String {
    pairs
        .iter()
        .map(|(name, value)| format!("{name}={value}"))
        .collect::<Vec<_>>()
        .join("; ")
}

/// Sanitize log messages to remove sensitive data
fn sanitize_log_message(msg: &str) -> String {
    // Remove potential tokens, cookies, etc.
    msg.replace(&['=', ':', '&'][..], "*")
}

/// Append log line to file
fn append_log_line(args: fmt::Arguments) {
    let message = format!("{}", args);
    if let Some(file_mutex) = APP_LOG_FILE.get() {
        if let Ok(mut file_opt) = file_mutex.lock() {
            if let Some(file) = file_opt.as_mut() {
                let _ = writeln!(file, "{}", message);
            }
        }
    }
}

/// Initialize logging
fn init_logging(app: &tauri::AppHandle) {
    if let Ok(log_dir) = app.path().app_log_dir() {
        let _ = fs::create_dir_all(&log_dir);
        let log_file = log_dir.join(CURRENT_LOG_FILE_NAME);
        if let Ok(file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_file)
        {
            let _ = APP_LOG_FILE.set(Mutex::new(Some(file)));
        }
    }
}

/// Tauri command: Get app version
#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Tauri command: Get app name
#[tauri::command]
fn get_app_name() -> String {
    "Amber Music".to_string()
}

/// Tauri command: Open external URL
#[tauri::command]
async fn open_external_url(url: String, app: tauri::AppHandle) -> Result<(), String> {
    tauri::plugin_opener::open_url(&app, &url, None)
        .map_err(|e| format!("Failed to open URL: {}", e))
}

/// Tauri command: Show item in folder
#[tauri::command]
async fn show_item_in_folder(path: String, app: tauri::AppHandle) -> Result<(), String> {
    tauri::plugin_opener::reveal_item_in_dir(&app, &path)
        .map_err(|e| format!("Failed to show item: {}", e))
}

/// Tauri command: Get platform info
#[tauri::command]
fn get_platform_info() -> serde_json::Value {
    serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY,
    })
}

/// Tauri command: Check for updates
#[tauri::command]
async fn check_updates(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    use tauri_plugin_updater::UpdaterExt;
    
    let updater = app.updater_builder()
        .build()
        .map_err(|e| format!("Failed to build updater: {}", e))?;
    
    let update = updater
        .check()
        .await
        .map_err(|e| format!("Update check failed: {}", e))?;
    
    Ok(serde_json::json!({
        "available": update.is_some(),
        "version": update.map(|u| u.version),
        "notes": update.map(|u| u.body),
        "date": update.map(|u| u.date),
    }))
}

/// Tauri command: Install update
#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    
    let updater = app.updater_builder()
        .build()
        .map_err(|e| format!("Failed to build updater: {}", e))?;
    
    let update = updater
        .check()
        .await
        .map_err(|e| format!("Update check failed: {}", e))?;
    
    if let Some(update) = update {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| format!("Update install failed: {}", e))?;
    }
    
    Ok(())
}

/// Tauri command: Get process memory usage
#[tauri::command]
fn get_memory_usage() -> serde_json::Value {
    use process_memory::get_process_memory;
    
    let (rss, vms) = get_process_memory();
    serde_json::json!({
        "rss_mb": rss / 1024 / 1024,
        "vms_mb": vms / 1024 / 1024,
    })
}

/// Tauri command: Minimize to tray
#[tauri::command]
fn minimize_to_tray(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Show window
#[tauri::command]
fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Set window size
#[tauri::command]
fn set_window_size(app: tauri::AppHandle, width: f64, height: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Set window position
#[tauri::command]
fn set_window_position(app: tauri::AppHandle, x: f64, y: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Toggle fullscreen
#[tauri::command]
fn toggle_fullscreen(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
        window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Get available audio output devices
#[tauri::command]
async fn get_audio_output_devices() -> Result<Vec<serde_json::Value>, String> {
    // Return basic device info - actual device enumeration would need platform-specific code
    Ok(vec![
        serde_json::json!({
            "id": "default",
            "name": "Default",
            "is_default": true,
        })
    ])
}

/// Tauri command: Set audio output device
#[tauri::command]
async fn set_audio_output_device(device_id: String) -> Result<(), String> {
    // Store preference for frontend to use
    // Actual device switching happens in frontend via Web Audio API
    Ok(())
}

/// Tauri command: Get cache size
#[tauri::command]
async fn get_cache_size(app: tauri::AppHandle) -> Result<u64, String> {
    let cache_dir = app.path().app_cache_dir()
        .map_err(|e| e.to_string())?;
    
    let mut total_size = 0u64;
    if cache_dir.exists() {
        for entry in walkdir::WalkDir::new(&cache_dir) {
            if let Ok(entry) = entry {
                if let Ok(metadata) = entry.metadata() {
                    total_size += metadata.len();
                }
            }
        }
    }
    Ok(total_size)
}

/// Tauri command: Clear cache
#[tauri::command]
async fn clear_cache(app: tauri::AppHandle) -> Result<(), String> {
    let cache_dir = app.path().app_cache_dir()
        .map_err(|e| e.to_string())?;
    
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Get app logs
#[tauri::command]
async fn get_app_logs(app: tauri::AppHandle, lines: Option<usize>) -> Result<String, String> {
    let log_dir = app.path().app_log_dir()
        .map_err(|e| e.to_string())?;
    let log_file = log_dir.join(CURRENT_LOG_FILE_NAME);
    
    if !log_file.exists() {
        return Ok(String::new());
    }
    
    let content = fs::read_to_string(&log_file).map_err(|e| e.to_string())?;
    let lines = lines.unwrap_or(500);
    let result: Vec<&str> = content.lines().rev().take(lines).collect();
    Ok(result.into_iter().rev().collect::<Vec<_>>().join("\n"))
}

/// Tauri command: Open log file
#[tauri::command]
async fn open_log_file(app: tauri::AppHandle) -> Result<(), String> {
    let log_dir = app.path().app_log_dir()
        .map_err(|e| e.to_string())?;
    let log_file = log_dir.join(CURRENT_LOG_FILE_NAME);
    
    tauri::plugin_opener::open_path(&app, &log_file, None)
        .map_err(|e| e.to_string())
}

/// Tauri command: Get autostart status
#[tauri::command]
async fn get_autostart_status(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::AutostartExt;
    app.autostart().is_enabled().map_err(|e| e.to_string())
}

/// Tauri command: Set autostart
#[tauri::command]
async fn set_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::AutostartExt;
    if enabled {
        app.autostart().enable().map_err(|e| e.to_string())?;
    } else {
        app.autostart().disable().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Tauri command: Register global shortcut
#[tauri::command]
async fn register_global_shortcut(
    app: tauri::AppHandle,
    shortcut: String,
    handler: String,
) -> Result<(), String> {
    use tauri::GlobalShortcutExt;
    app.global_shortcut()
        .register(&shortcut)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Tauri command: Unregister global shortcut
#[tauri::command]
async fn unregister_global_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    use tauri::GlobalShortcutExt;
    app.global_shortcut()
        .unregister(&shortcut)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Tauri command: Get all global shortcuts
#[tauri::command]
async fn get_global_shortcuts(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    use tauri::GlobalShortcutExt;
    Ok(app.global_shortcut().registered())
}

/// Tauri command: Proxy HTTP request (for CORS bypass in desktop)
#[tauri::command]
async fn proxy_http_request(
    url: String,
    method: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let mut request = client.request(method.parse().unwrap_or(reqwest::Method::GET), &url);

    if let Some(headers) = headers {
        for (key, value) in headers {
            request = request.header(key, value);
        }
    }

    if let Some(body) = body {
        request = request.body(body);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let response_headers = response.headers().clone();
    let text = response.text().await.map_err(|e| e.to_string())?;

    let mut headers_map = HashMap::new();
    for (key, value) in response_headers.iter() {
        if let Ok(v) = value.to_str() {
            headers_map.insert(key.to_string(), v.to_string());
        }
    }

    Ok(serde_json::json!({
        "status": status,
        "headers": headers_map,
        "body": text,
    }))
}

/// Tauri command: Read file
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Tauri command: Write file
#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

/// Tauri command: Delete file
#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| e.to_string())
}

/// Tauri command: List directory
#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<serde_json::Value>, String> {
    let mut entries = Vec::new();
    for entry in fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        entries.push(serde_json::json!({
            "name": entry.file_name().to_string_lossy(),
            "path": entry.path().to_string_lossy(),
            "is_dir": metadata.is_dir(),
            "size": metadata.len(),
            "modified": metadata.modified().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok()).map(|d| d.as_secs()),
        }));
    }
    Ok(entries)
}

/// Tauri command: Create directory
#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

/// Tauri command: Get app data directory
#[tauri::command]
fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path().app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// Tauri command: Get app config directory
#[tauri::command]
fn get_app_config_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path().app_config_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// Tauri command: Get app cache directory
#[tauri::command]
fn get_app_cache_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path().app_cache_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// Tauri command: Get app log directory
#[tauri::command]
fn get_app_log_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path().app_log_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// Tauri command: Copy text to clipboard
#[tauri::command]
async fn copy_to_clipboard(text: String, app: tauri::AppHandle) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}

/// Tauri command: Get text from clipboard
#[tauri::command]
async fn get_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| e.to_string())
}

/// Tauri command: Get keyring item
#[tauri::command]
async fn get_keyring_item(service: String, user: String) -> Result<Option<String>, String> {
    use keyring::Entry;
    let entry = Entry::new(&service, &user).map_err(|e| e.to_string())?;
    entry.get_password().ok()
}

/// Tauri command: Set keyring item
#[tauri::command]
async fn set_keyring_item(service: String, user: String, password: String) -> Result<(), String> {
    use keyring::Entry;
    let entry = Entry::new(&service, &user).map_err(|e| e.to_string())?;
    entry.set_password(&password).map_err(|e| e.to_string())
}

/// Tauri command: Delete keyring item
#[tauri::command]
async fn delete_keyring_item(service: String, user: String) -> Result<(), String> {
    use keyring::Entry;
    let entry = Entry::new(&service, &user).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}

/// Tauri command: Get Discord RPC status
#[tauri::command]
fn get_discord_rpc_status() -> Result<serde_json::Value, String> {
    use discord_rpc::DiscordRpcService;
    Ok(DiscordRpcService::status())
}

/// Tauri command: Set Discord RPC activity
#[tauri::command]
async fn set_discord_rpc_activity(
    state: Option<String>,
    details: Option<String>,
    large_image: Option<String>,
    large_text: Option<String>,
    small_image: Option<String>,
    small_text: Option<String>,
    start_timestamp: Option<u64>,
    end_timestamp: Option<u64>,
) -> Result<(), String> {
    use discord_rpc::DiscordRpcService;
    DiscordRpcService::set_activity(
        state,
        details,
        large_image,
        large_text,
        small_image,
        small_text,
        start_timestamp,
        end_timestamp,
    ).map_err(|e| e.to_string())
}

/// Tauri command: Clear Discord RPC activity
#[tauri::command]
async fn clear_discord_rpc_activity() -> Result<(), String> {
    use discord_rpc::DiscordRpcService;
    DiscordRpcService::clear_activity().map_err(|e| e.to_string())
}

/// Tauri command: Equalizer - get bands
#[tauri::command]
fn get_equalizer_bands() -> Result<Vec<f32>, String> {
    use equalizer::Equalizer;
    Ok(Equalizer::get_bands())
}

/// Tauri command: Equalizer - set bands
#[tauri::command]
async fn set_equalizer_bands(bands: Vec<f32>) -> Result<(), String> {
    use equalizer::Equalizer;
    Equalizer::set_bands(bands).map_err(|e| e.to_string())
}

/// Tauri command: Equalizer - get presets
#[tauri::command]
fn get_equalizer_presets() -> Result<serde_json::Value, String> {
    use equalizer::Equalizer;
    Ok(Equalizer::get_presets())
}

/// Tauri command: Equalizer - set preset
#[tauri::command]
async fn set_equalizer_preset(preset: String) -> Result<(), String> {
    use equalizer::Equalizer;
    Equalizer::set_preset(&preset).map_err(|e| e.to_string())
}

/// Tauri command: Audio - get visualizer data
#[tauri::command]
fn get_audio_visualizer_data() -> Result<Vec<f32>, String> {
    use audio::AudioEngine;
    Ok(AudioEngine::get_visualizer_data())
}

/// Tauri command: Audio - get spectrum data
#[tauri::command]
fn get_audio_spectrum() -> Result<Vec<f32>, String> {
    use audio::AudioEngine;
    Ok(AudioEngine::get_spectrum())
}

/// Tauri command: Audio - get waveform data
#[tauri::command]
fn get_audio_waveform() -> Result<Vec<f32>, String> {
    use audio::AudioEngine;
    Ok(AudioEngine::get_waveform())
}

/// Tauri command: Process - get CPU usage
#[tauri::command]
fn get_cpu_usage() -> Result<f32, String> {
    use process_memory::get_cpu_usage;
    Ok(get_cpu_usage())
}

/// Tauri command: Process - get memory usage
#[tauri::command]
fn get_process_memory_usage() -> Result<serde_json::Value, String> {
    use process_memory::get_process_memory;
    let (rss, vms) = get_process_memory();
    Ok(serde_json::json!({
        "rss_mb": rss / 1024 / 1024,
        "vms_mb": vms / 1024 / 1024,
    }))
}

/// Tauri command: System - get battery status (macOS/Windows)
#[tauri::command]
fn get_battery_status() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "macos")]
    {
        use macos_media::get_battery_status;
        get_battery_status().map_err(|e| e.to_string())
    }
    #[cfg(target_os = "windows")]
    {
        use windows_media::get_battery_status;
        get_battery_status().map_err(|e| e.to_string())
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Ok(serde_json::json!({
            "level": 1.0,
            "charging": true,
            "plugged_in": true,
        }))
    }
}

/// Tauri command: System - get network status
#[tauri::command]
fn get_network_status() -> Result<serde_json::Value, String> {
    // Basic network check
    let online = std::net::TcpStream::connect_timeout(
        &"8.8.8.8:53".parse().unwrap(),
        Duration::from_secs(2),
    ).is_ok();
    
    Ok(serde_json::json!({
        "online": online,
    }))
}

/// Main entry point for the Tauri app
pub fn run() {
    // Performance: Pre-allocate capacity for collections
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(|_app_handle, _window, _config| {
            // Autostart configuration
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_localhost::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Single instance to prevent multiple app windows
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(move |app| {
            // Initialize logging
            init_logging(app);
            
            // Migrate legacy app data if needed
            // migrate_legacy_app_data(app); // Not needed for new app
            
            // Initialize Discord RPC
            #[cfg(not(debug_assertions))]
            {
                use discord_rpc::DiscordRpcService;
                let _ = DiscordRpcService::init();
            }
            
            // Initialize audio engine
            #[cfg(not(debug_assertions))]
            {
                use audio::AudioEngine;
                AudioEngine::init();
            }
            
            // Initialize equalizer
            #[cfg(not(debug_assertions))]
            {
                use equalizer::Equalizer;
                Equalizer::init();
            }
            
            // Configure window
            if let Some(window) = app.get_webview_window("main") {
                // Performance: Disable unnecessary features
                #[cfg(target_os = "windows")]
                {
                    use windows_media::configure_window;
                    configure_window(window.clone());
                }
                
                // Set up window event handlers
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    use tauri::WindowEvent;
                    match event {
                        WindowEvent::CloseRequested { api, .. } => {
                            // Minimize to tray instead of closing
                            api.prevent_close();
                            let _ = window_clone.minimize();
                        }
                        WindowEvent::Focused(focused) => {
                            if focused {
                                // Window gained focus
                            } else {
                                // Window lost focus
                            }
                        }
                        _ => {}
                    }
                });
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // App info
            get_version,
            get_app_name,
            get_platform_info,
            
            // Window management
            minimize_to_tray,
            show_window,
            set_window_size,
            set_window_position,
            toggle_fullscreen,
            
            // Updates
            check_updates,
            install_update,
            
            // System
            get_memory_usage,
            get_cpu_usage,
            get_process_memory_usage,
            get_battery_status,
            get_network_status,
            
            // Audio devices
            get_audio_output_devices,
            set_audio_output_device,
            
            // Cache
            get_cache_size,
            clear_cache,
            
            // Logs
            get_app_logs,
            open_log_file,
            
            // Autostart
            get_autostart_status,
            set_autostart,
            
            // Global shortcuts
            register_global_shortcut,
            unregister_global_shortcut,
            get_global_shortcuts,
            
            // External
            open_external_url,
            show_item_in_folder,
            
            // HTTP proxy
            proxy_http_request,
            
            // File system
            read_file,
            write_file,
            delete_file,
            list_directory,
            create_directory,
            get_app_data_dir,
            get_app_config_dir,
            get_app_cache_dir,
            get_app_log_dir,
            
            // Clipboard
            copy_to_clipboard,
            get_clipboard_text,
            
            // Keyring
            get_keyring_item,
            set_keyring_item,
            delete_keyring_item,
            
            // Discord RPC
            get_discord_rpc_status,
            set_discord_rpc_activity,
            clear_discord_rpc_activity,
            
            // Equalizer
            get_equalizer_bands,
            set_equalizer_bands,
            get_equalizer_presets,
            set_equalizer_preset,
            
            // Audio visualization
            get_audio_visualizer_data,
            get_audio_spectrum,
            get_audio_waveform,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    builder.run(|_app_handle, event| {
        use tauri::RunEvent;
        match event {
            RunEvent::ExitRequested { api, .. } => {
                // Keep running in background if minimized to tray
                #[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
                {
                    api.prevent_exit();
                }
            }
            RunEvent::WindowEvent { label, event, .. } => {
                if label == "main" {
                    use tauri::WindowEvent;
                    if matches!(event, WindowEvent::CloseRequested { .. }) {
                        // Already handled in setup
                    }
                }
            }
            _ => {}
        }
    });
}