
// ==========================================
// 1. GET CHATBOT ELEMENTS
// ==========================================

const chatButton = document.getElementById("chatbot-button");
const chatWindow = document.getElementById("chatbot-window");
const closeButton = document.getElementById("chatbot-close");
const sendButton = document.getElementById("chatbot-send");
const messageInput = document.getElementById("chatbot-input");
const chatMessages = document.getElementById("chatbot-messages");


// ==========================================
// 2. OPEN CHATBOT
// ==========================================

chatButton.addEventListener("click", function () {

    chatWindow.classList.add("active");

    chatButton.style.display = "none";

    messageInput.focus();

});


// ==========================================
// 3. CLOSE CHATBOT
// ==========================================

closeButton.addEventListener("click", function () {

    chatWindow.classList.remove("active");

    chatButton.style.display = "flex";

});


// ==========================================
// 4. DISPLAY MESSAGE
// ==========================================

function displayMessage(message, sender) {

    const messageElement = document.createElement("div");

    messageElement.classList.add("chat-message", sender);

    messageElement.textContent = message;

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;

}


// ==========================================
// 5. SEND MESSAGE TO FLASK
// ==========================================

async function sendMessage() {

    const message = messageInput.value.trim();

    if (message === "") {
        return;
    }

    // Display user message

    displayMessage(message, "user");

    messageInput.value = "";

    sendButton.disabled = true;

    try {

        const response = await fetch("/chatbot", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.error || "Unable to get a response.");

        }

        // Display chatbot answer

        displayMessage(data.reply, "bot");

    }

    catch (error) {

        console.error("Chatbot Error:", error);

        displayMessage(
            "Sorry, I couldn't process your question. Please try again.",
            "bot"
        );

    }

    finally {

        sendButton.disabled = false;

        messageInput.focus();

    }

}


// ==========================================
// 6. SEND BUTTON CLICK
// ==========================================

sendButton.addEventListener("click", sendMessage);


// ==========================================
// 7. SEND MESSAGE USING ENTER KEY
// ==========================================

messageInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        sendMessage();

    }

});
