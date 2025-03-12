// Hämta post-ID från URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Hämta inlägg och användare från localStorage
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];

// Hämta inlägget baserat på ID
let post = posts.find(p => p.id == postId);

// ✅ Kontrollera om inlägget existerar
if (!post) {
    console.error("❌ Inlägg hittades inte i localStorage!");
} else {
    // ✅ Se till att `post.reactions` har rätt struktur
    if (!post.reactions || typeof post.reactions !== "object") {
        post.reactions = { likes: 0, dislikes: 0, total: 0 };
    }

    // ✅ Se till att `post.reactions.total` alltid är ett giltigt nummer
    if (!post.reactions.total || isNaN(post.reactions.total)) {
        post.reactions.total = post.reactions.likes + post.reactions.dislikes;
    }

    // ✅ Spara uppdaterad `post.reactions` i localStorage
    localStorage.setItem('posts', JSON.stringify(posts));
}

// ✅ Funktion för att fylla dropdown med användare
function populateUserDropdown() {
    const userSelect = document.getElementById("comment-user");

    if (!userSelect) {
        console.error("❌ Dropdown för användare saknas!");
        return;
    }

    // Rensa dropdown innan fyllning
    userSelect.innerHTML = '<option value="" selected disabled>Välj användare</option>';

    users.forEach(user => {
        let option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.username;
        userSelect.appendChild(option);
    });

    console.log("✅ Användare laddade i dropdown:", users);
}

// ✅ Hämta användare om det saknas i LocalStorage
async function fetchUsersIfNeeded() {
    if (users.length === 0) {
        try {
            const response = await fetch("https://dummyjson.com/users?limit=0"); 
            const data = await response.json();
            users = data.users;
            localStorage.setItem("users", JSON.stringify(users));
            console.log("✅ Användare hämtade från API:", users);
        } catch (error) {
            console.error("❌ Fel vid hämtning av användare:", error);
        }
    }
}

// ✅ Hämta och rendera kommentarer
async function fetchComments() {
    let comments = [];

    try {
        const storedComments = localStorage.getItem(`comments_${postId}`);
        
        if (storedComments) {
            comments = JSON.parse(storedComments);
        }

    } catch (error) {
        console.error("❌ JSON.parse-fel vid hämtning av kommentarer från localStorage:", error);
        localStorage.removeItem(`comments_${postId}`); // Rensar ogiltig data
    }

    console.log("📌 Hämtade kommentarer från localStorage:", comments);

    if (!Array.isArray(comments)) {
        comments = []; // Säkerställ att comments alltid är en array
    }

    if (comments.length === 0) {
        try {
            const response = await fetch(`https://dummyjson.com/comments/post/${postId}`);
            if (!response.ok) throw new Error(`API-anrop misslyckades med status: ${response.status}`);
            
            const data = await response.json();
            comments = data.comments || [];

            if (comments.length > 0) {
                localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
                console.log("✅ Kommentarer hämtade från API och sparade:", comments);
            } else {
                console.warn("⚠️ Inga kommentarer hittades i API:et.");
            }
        } catch (error) {
            console.error("❌ Fel vid hämtning av kommentarer från API:", error);
        }
    }

    renderComments(comments);
}

// ✅ Rendera kommentarer i HTML
function renderComments(comments) {
    const commentsContainer = document.getElementById("comments");
    commentsContainer.innerHTML = "<h3>Kommentarer:</h3>";

    comments.forEach(comment => {
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment");

        commentElement.innerHTML = `
            <p><strong>${comment.user.username}:</strong> ${comment.body}</p>
        `;

        commentsContainer.appendChild(commentElement);
    });

    console.log("✅ Kommentarer laddade:", comments);
}

// ✅ Lägg till ny kommentar
function addComment(event) {
    event.preventDefault(); // Förhindra sidladdning

    const commentBody = document.getElementById("comment-body").value;
    const userId = document.getElementById("comment-user").value;

    if (!commentBody || !userId) {
        alert("Du måste skriva en kommentar och välja en användare!");
        return;
    }

    // ✅ Hämta användarens namn
    const user = users.find(u => u.id == userId);

    // ✅ Skapa en ny kommentar
    const newComment = {
        id: Date.now(), // Unikt ID
        body: commentBody,
        user: { id: user.id, username: user.username },
        postId: postId
    };

    // ✅ Hämta befintliga kommentarer från localStorage
    let comments = JSON.parse(localStorage.getItem(`comments_${postId}`)) || [];
    comments.push(newComment);

    // ✅ Spara tillbaka i localStorage
    localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));

    // ✅ Visa den nya kommentaren direkt
    renderComments(comments);

    // ✅ Rensa formuläret
    document.getElementById("comment-body").value = "";
    document.getElementById("comment-user").value = "";
}

// ✅ Uppdatera och spara reaktioner i LocalStorage
function updateReactions() {
    document.getElementById('likes-count').textContent = post.reactions.likes;
    document.getElementById('dislikes-count').textContent = post.reactions.dislikes;
    document.getElementById('reactions-count').textContent = post.reactions.total || 0;

    // Uppdatera localStorage
    const postIndex = posts.findIndex(p => p.id == postId);
    if (postIndex !== -1) {
        posts[postIndex] = post;
        localStorage.setItem('posts', JSON.stringify(posts));
    }
}

// ✅ Visa inlägget
async function displayPost() {
    await fetchUsersIfNeeded();

    if (!post) return;

    // ✅ Hitta rätt användarnamn
    const user = users.find(user => user.id == Number(post.userId));
    console.log("🔍 Hittad användare:", user); // Debugga för att se om användaren hittas

    const username = user ? user.username : `Användare ${post.userId}`;

    // ✅ Uppdatera HTML med inläggsdata
    document.getElementById("post-details").innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.body}</p>
        <p><strong>Skapad av:</strong> ${username}</p> 
        <p><strong>Taggar:</strong> ${post.tags ? post.tags.join(", ") : "Inga taggar"}</p>
        <p><strong>Totala reaktioner:</strong> <span id="reactions-count">${post.reactions.total}</span></p>
        <div id="reactions">
            <button id="like-btn">👍 <span id="likes-count">${post.reactions.likes}</span></button>
            <button id="dislike-btn">👎 <span id="dislikes-count">${post.reactions.dislikes}</span></button>
        </div>
    `;

    // ✅ Lägg till event listeners för like och dislike
    document.getElementById('like-btn').addEventListener('click', () => {
        post.reactions.likes += 1;
        post.reactions.total += 1;
        updateReactions();
    });

    document.getElementById('dislike-btn').addEventListener('click', () => {
        post.reactions.dislikes += 1;
        post.reactions.total += 1;
        updateReactions();
    });

    // ✅ Ladda kommentarer och fyll dropdown
    fetchComments();
    populateUserDropdown();

    // ✅ Lägg till event listener för kommentarsformulär
    document.getElementById("comment-form").addEventListener("submit", addComment);
}

// ✅ Starta funktionen när sidan laddas
displayPost();
document.getElementById("back-to-home").addEventListener("click", () => {
    window.location.href = "index.html";
});
