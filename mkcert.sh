if [[ -z "${1:-}" ]]; then
  echo "You need to specify public server IP to create certificate." >&2
  echo "Example: ./mkcert.sh 192.168.0.1" >&2
  exit 1
fi

# create a dir to store certificate
rm -rf cert
mkdir cert

ip=$1

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