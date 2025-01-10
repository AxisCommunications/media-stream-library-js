project('gst-rtsp-launch', 'c',
  version : '0.0.0',
  meson_version : '>= 0.49.0',
  default_options : [ 'warning_level=2',
                      'werror=true',
                      'buildtype=debugoptimized' ])

gst_dep = dependency('gstreamer-1.0')
gst_rtsp_server_dep = dependency('gstreamer-rtsp-server-1.0')

executable('gst-rtsp-launch',
  'gst-rtsp-launch.c',
  dependencies : [
    gst_dep,
    gst_rtsp_server_dep,
  ]
)