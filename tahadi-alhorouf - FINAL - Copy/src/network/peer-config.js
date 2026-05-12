const PEER_SERVERS = [
  { host: '0.peerjs.com', port: 443, secure: true, path: '/' },
  { host: '1.peerjs.com', port: 443, secure: true, path: '/' }
];

let currentServerIndex = 0;

function resetPeerServerIndex() {
  currentServerIndex = 0;
}

function getPeerOptions() {
  const srv = PEER_SERVERS[currentServerIndex];
  return {
    host: srv.host,
    port: srv.port,
    secure: srv.secure,
    path: srv.path,
    debug: 0,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    }
  };
}

function rotateServer() {
  if (currentServerIndex < PEER_SERVERS.length - 1) {
    currentServerIndex++;
    return true;
  }
  currentServerIndex = 0;
  return false;
}
