from __future__ import absolute_import

from .native import View as NativeSourceMapView

try:
    from libsourcemap import View as LibSourceMapView, IndexedSourceMap

    class View(object):
        @staticmethod
        def from_json(buffer):
            try:
                return LibSourceMapView.from_json(buffer)
            except IndexedSourceMap:
                return NativeSourceMapView.from_json(buffer)

except ImportError:
    View = NativeSourceMapView
