
// =====================================
// FEATURE 13: USER LOGIN & SIGNUP
// =====================================

// SIGNUP FUNCTION
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        const message = document.getElementById("authMessage");

        try {
            const response = await fetch("/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: name,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();
            message.textContent = result.message || result.error;

            if (response.ok) {
                alert("Account created successfully!");
                window.location.href = "login.html";
            }

        } catch (error) {
            message.textContent = "Unable to connect to the server.";
            console.error(error);
        }
    });
}


// =====================================
// LOGIN FUNCTION
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const message = document.getElementById("authMessage");

        try {

            const response = await fetch("/login", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            message.textContent = result.message || result.error;

            if (response.ok) {

                // Verify Flask session
                const statusResponse = await fetch("/auth-status", {
                    credentials: "same-origin"
                });

                const status = await statusResponse.json();

                if (status.logged_in) {

                    alert("Login successful!");

                    window.location.href = "/home";

                } else {

                    message.textContent =
                        "Login session could not be verified.";

                }

            }

        } catch (error) {

            message.textContent = "Unable to connect to server.";

            console.error("Login error:", error);

        }

    });

}
