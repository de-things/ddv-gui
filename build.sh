arch=$(uname -m)

echo "Building a standalone executable for $arch architecture."

./bundle.sh

mkdir -p -- bin

rm -rf bin/$arch
mkdir bin/$arch

npx esbuild ./server.js --bundle --platform=node --format=esm --outfile=server.tmp.js
node --build-sea sea-config.json
rm server.tmp.js
mv server bin/$arch/server

cp -r public bin/$arch/public
cp -r cert bin/$arch/cert
cp config.json bin/$arch/config.json