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

// Opens and minimizes the streaming overlay panel smoothly
toggleBtn.addEventListener('click', () => { 
    overlay.style.display = (overlay.style.display === 'flex') ? 'none' : 'flex'; 
});
closeOverlay.addEventListener('click', () => { 
    overlay.style.display = 'none'; 
});

// Requests screen frame broadcast authorization hooks from the desktop browser
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

// HOST CONNECTION LOGIC
btnHost.addEventListener('click', async () => {
    const success = await startCapture();
    if (!success) return;
    
    // Generate a secure random matching code number sequence string
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Bind to the distributed cloud broker socket using unique game room identification rules
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
        console.error(err);
        statusText.innerText = "| Network Error: Setup failed. Try again.";
        statusText.style.color = "#ef4444";
    });

    // Event monitoring thread: Listen for incoming connections from your matching friend
    peer.on('call', (call) => {
        statusText.innerText = "| Status: Friend Connected! Live Stream Active.";
        statusText.style.color = "#a855f7";
        call.answer(localStream); // Echo your captured game tab display loop back outwards
        
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

// JOIN CONNECTION LOGIC
btnJoin.addEventListener('click', async () => {
    const code = roomInput.value.trim();
    if (code.length !== 4 || isNaN(code)) {
        alert("Please enter a valid 4-digit code provided by your friend.");
        return;
    }

    const success = await startCapture();
    if (!success) return;

    // Spin up a flexible runtime client peer node 
    peer = new Peer({ debug: 1 });

    statusText.innerText = "| Status: Connecting to friend...";
    statusText.style.color = "#eab308";

    peer.on('open', () => {
        const targetPeerId = `agames-8ball-${code}`;
        // Call out into the matching server directory cloud system to hand over your capture feed
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
        console.error(err);
        statusText.innerText = "| Match Error: Check code or host status.";
        statusText.style.color = "#ef4444";
    });
});
