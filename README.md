# threejs-modelmultiloader

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

A threejs model loader that supports DAE, JSON and a few custom variations of JSON which support streaming and compression.

Supported formats are:
- DAE (Autodesk collada)
- JSON (converted by the official threejs converter)
- JSON TREE (A split up version of the JSON format, optimized for streaming)
- TARGZ (A compressed version of the JSON format, optimized for size)
- TARGZ TREE(A compressed version of the JSON TREE format, optimized for size and streaming)

## Usage

[![NPM](https://nodei.co/npm/threejs-modelmultiloader.png)](https://nodei.co/npm/threejs-modelmultiloader/)

## License

MIT, see [LICENSE.md](http://github.com/bunnybones1/threejs-modelmultiloader/blob/master/LICENSE.md) for details.
