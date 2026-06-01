const toggleBtn = document.getElementById('stream-toggle-btn');
const overlay = document.getElementById('stream-overlay');
const closeOverlay = document.getElementById('close-overlay');
const roomInput = document.getElementById('room-input');
const btnHost = document.getElementById('btn-host');
const btnJoin = document.getElementById('btn-join');
const statusText = document.getElementById('status-text');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

let peer = null;
let localStream = null;

toggleBtn.addEventListener('click', () => { 
    overlay.style.display = (overlay.style.display === 'flex') ? 'none' : 'flex'; 
});
closeOverlay.addEventListener('click', () => { 
    overlay.style.display = 'none'; 
});

async function startCapture() {
    try {
        localStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { cursor: "always" }, 
            audio: false 
        });
        localVideo.srcObject = localStream;
        return true;
    } catch (err) {
        statusText.innerText = "| Error: Screen capture permission denied.";
        statusText.style.color = "#ef4444";
        return false;
    }
}

btnHost.addEventListener('click', async () => {
    const success = await startCapture();
    if (!success) return;
    
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    peer = new Peer(`agames-8ball-${randomCode}`, { debug: 1 });
    
    statusText.innerText = "| Status: Initializing host network...";
    statusText.style.color = "#eab308";

    peer.on('open', (id) => {
        statusText.innerText = `| YOUR CODE: ${randomCode} (Give this to your friend)`;
        statusText.style.color = "#22c55e";
        btnHost.disabled = true;
        btnJoin.disabled = true;
        roomInput.style.display = "none";
        document.getElementById('or-label').style.display = "none";
    });

    peer.on('error', (err) => {
        statusText.innerText = "| Network Error: Setup failed. Try again.";
        statusText.style.color = "#ef4444";
    });

    peer.on('call', (call) => {
        statusText.innerText = "| Status: Friend Connected! Live Stream Active.";
        statusText.style.color = "#a855f7";
        call.answer(localStream);
        
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
        });
        
        call.on('close', () => {
            remoteVideo.srcObject = null;
            statusText.innerText = "| Status: Friend disconnected.";
            statusText.style.color = "#ef4444";
        });
    });
});

btnJoin.addEventListener('click', async () => {
    const code = roomInput.value.trim();
    if (code.length !== 4 || isNaN(code)) {
        alert("Please enter a valid 4-digit code.");
        return;
    }

    const success = await startCapture();
    if (!success) return;

    peer = new Peer({ debug: 1 });
    statusText.innerText = "| Status: Connecting to friend...";
    statusText.style.color = "#eab308";

    peer.on('open', () => {
        const targetPeerId = `agames-8ball-${code}`;
        const call = peer.call(targetPeerId, localStream);
        
        call.on('stream', (remoteStream) => {
            statusText.innerText = "| Status: Connected! Screen layout synchronized.";
            statusText.style.color = "#22c55e";
            remoteVideo.srcObject = remoteStream;
        });

        call.on('close', () => {
            remoteVideo.srcObject = null;
            statusText.innerText = "| Status: Disconnected from match.";
            statusText.style.color = "#ef4444";
        });
    });

    peer.on('error', (err) => {
        statusText.innerText = "| Match Error: Check code or host status.";
        statusText.style.color = "#ef4444";
    });
});
