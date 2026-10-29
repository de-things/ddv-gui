# create a dir to store certificates data
mkdir -p -- "./cert"

# get public ip address
# (ipv4 by default, but first script flag set to '-6' will set it to ipv6)
ip=$(ip -o ${1:-"-4"} addr show scope global | awk '{sub(/\/.*/, "", $4); print $4}')

# gen A private key
ca_key=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072)

# gen A cert
ca=$(openssl req -x509 -new -key <(printf '%s\n' "$ca_key") -sha256 -days 3650 \
  -config <(printf "%s\n" \
    "[req]" \
    "prompt = no" \
    "distinguished_name = dn" \
    "x509_extensions = v3_ca" \
    "[dn]" \
    "CN = de:things poor user" \
    "[v3_ca]" \
    "basicConstraints = critical, CA:TRUE" \
    "keyUsage = critical, keyCertSign, cRLSign" \
    "subjectKeyIdentifier = hash"))

# convert cert to an preferable format
# to install on some device to make this server's cert trustable
printf '%s\n' "$ca" | openssl x509 -outform DER -out ./cert/trusted.crt

# gen cert request with an output of server private key
csr=$(openssl req -new -newkey rsa:2048 -nodes \
  -keyout ./cert/server.key \
  -subj "/CN=$ip")

# gen server cert
printf '%s\n' "$csr" | openssl x509 -req \
  -CA <(printf '%s\n' "$ca") -CAkey <(printf '%s\n' "$ca_key") \
  -CAserial ./cert/sn.srl -CAcreateserial \
  -out ./cert/server.crt -days 365 -sha256 \
  -extfile <(printf "%s\n" \
    "basicConstraints = critical, CA:FALSE" \
    "keyUsage = critical, digitalSignature, keyEncipherment" \
    "extendedKeyUsage = serverAuth" \
    "subjectAltName = IP:$ip")

# remove serial number file
rm ./cert/sn.srl