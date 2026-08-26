// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
fn set_windows_app_identity() {
    use windows::{core::w, Win32::UI::Shell::SetCurrentProcessExplicitAppUserModelID};

    if let Err(error) =
        unsafe { SetCurrentProcessExplicitAppUserModelID(w!("com.pant0x.ambermusic")) }
    {
        eprintln!("[amber-music][warn] unable to set Windows AppUserModelID: {error}");
    }
}

fn main() {
    #[cfg(target_os = "windows")]
    set_windows_app_identity();

    // Disable WebView2 Visual Diagnostics overlay
    std::env::remove_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS");

    // Performance: Set up tokio runtime with optimal thread count
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(std::thread::available_parallelism().map_or(4, |n| n.get()))
        .enable_all()
        .build()
        .expect("Failed to create tokio runtime");

    // Set global default runtime
    let _guard = runtime.enter();

    // Performance: Configure memory allocator hints
    #[cfg(target_os = "linux")]
    {
        // Use jemalloc on Linux if available
        // std::env::set_var("MALLOC_CONF", "background_thread:true,metadata_thp:always");
    }

    amber_music_lib::run()
}