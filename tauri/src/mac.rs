// https://github.com/mountain-loop/yaak/blob/c09083ddec2bd995d7c21493ac50adf27f0f3fca/src-tauri/yaak-mac-window/src/mac.rs
#![allow(deprecated)]

use tauri::{LogicalPosition, Runtime, Window};

struct UnsafeWindowHandle(*mut std::ffi::c_void);

unsafe impl Send for UnsafeWindowHandle {}

unsafe impl Sync for UnsafeWindowHandle {}

pub(crate) fn update_window_title<R: Runtime>(
  window: Window<R>,
  title: String,
  traffic_position: LogicalPosition<f64>,
) {
  use cocoa::{appkit::NSWindow, base::nil, foundation::NSString};

  unsafe {
    let window_handle = UnsafeWindowHandle(window.ns_window().unwrap());

    let _ = window.run_on_main_thread(move || {
      let window_title = NSString::alloc(nil).init_str(&title);
      NSWindow::setTitle_(window_handle.0 as cocoa::base::id, window_title);
      position_traffic_lights(window_handle, traffic_position);
    });
  }
}

pub fn setup_traffic_light_positioner<R: Runtime>(
  window: &Window<R>,
  traffic_position: LogicalPosition<f64>,
) {
  position_traffic_lights(
    UnsafeWindowHandle(window.ns_window().expect("Failed to create window handle")),
    traffic_position,
  );
}

fn position_traffic_lights(ns_window_handle: UnsafeWindowHandle, position: LogicalPosition<f64>) {
  use cocoa::appkit::{NSView, NSWindow, NSWindowButton};

  let ns_window = ns_window_handle.0 as cocoa::base::id;
  #[allow(unexpected_cfgs)]
  unsafe {
    let close = ns_window.standardWindowButton_(NSWindowButton::NSWindowCloseButton);
    let miniaturize = ns_window.standardWindowButton_(NSWindowButton::NSWindowMiniaturizeButton);
    let zoom = ns_window.standardWindowButton_(NSWindowButton::NSWindowZoomButton);
    let space_between = NSView::frame(miniaturize).origin.x - NSView::frame(close).origin.x;

    for (index, button) in [close, miniaturize, zoom].into_iter().enumerate() {
      let mut button_rect = NSView::frame(button);
      button_rect.origin.x = position.x + (index as f64 * space_between);
      button_rect.origin.y = position.y / 2.0;
      button.setFrameOrigin(button_rect.origin);
    }
  }
}
