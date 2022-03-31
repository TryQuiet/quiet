npm install -g node-gyp
npx node-gyp --verbose list
npx node-gyp --verbose install $(node -v)
npx node-gyp --verbose list
# TODO resolve "node-gyp" cache path or set it for "node-gyp" explicitly rather than hardcoding the value
ls "C:\Users\runneradmin\AppData\Local\node-gyp\Cache\$($(node -v).TrimStart('v'))\include\node"