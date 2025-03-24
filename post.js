// Hämta post-ID från URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

let posts = JSON.parse(localStorage.getItem('posts')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];

let post = posts.find(p => p.id == postId);

if (!post) {
    console.error("Inlägg hittades inte i localStorage!");
} else {
    if (!post.reactions || typeof post.reactions !== "object") {
        post.reactions = { likes: 0, dislikes: 0, total: 0 };
    }

    if (!post.reactions.total || isNaN(post.reactions.total)) {
        post.reactions.total = post.reactions.likes + post.reactions.dislikes;
    }

    localStorage.setItem('posts', JSON.stringify(posts));
}

// Fyll dropdown med användare
function populateUserDropdown() {
    const userSelect = document.getElementById("comment-user");
    if (!userSelect) {
        console.error("Dropdown för användare saknas!");
        return;
    }

    userSelect.innerHTML = '<option value="" selected disabled>Välj användare</option>';

    users.forEach(user => {
        let option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.username;
        userSelect.appendChild(option);
    });
}

// Hämta användare om de saknas i localStorage
async function fetchUsersIfNeeded() {
    if (users.length === 0) {
        try {
            const response = await fetch("https://dummyjson.com/users?limit=0");
            const data = await response.json();
            users = data.users;
            localStorage.setItem("users", JSON.stringify(users));
        } catch (error) {
            console.error("Fel vid hämtning av användare:", error);
        }
    }
}

// Hämta och rendera kommentarer
async function fetchComments() {
    let comments = [];

    try {
        const storedComments = localStorage.getItem(`comments_${postId}`);
        if (storedComments) {
            comments = JSON.parse(storedComments);
        }
    } catch (error) {
        console.error("JSON.parse-fel vid hämtning av kommentarer:", error);
        localStorage.removeItem(`comments_${postId}`);
    }

    if (!Array.isArray(comments)) {
        comments = [];
    }

    if (comments.length === 0) {
        try {
            const response = await fetch(`https://dummyjson.com/comments/post/${postId}`);
            if (!response.ok) throw new Error(`API-anrop misslyckades med status: ${response.status}`);

            const data = await response.json();
            comments = data.comments || [];

            if (comments.length > 0) {
                localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
            }
        } catch (error) {
            console.error("Fel vid hämtning av kommentarer från API:", error);
        }
    }

    renderComments(comments);
}

// Rendera kommentarer
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
}

// Lägg till ny kommentar
function addComment(event) {
    event.preventDefault();

    const commentBody = document.getElementById("comment-body").value;
    const userId = document.getElementById("comment-user").value;

    if (!commentBody || !userId) {
        alert("Du måste skriva en kommentar och välja en användare!");
        return;
    }

    const user = users.find(u => u.id == userId);

    const newComment = {
        id: Date.now(),
        body: commentBody,
        user: { id: user.id, username: user.username },
        postId: postId
    };

    let comments = JSON.parse(localStorage.getItem(`comments_${postId}`)) || [];
    comments.push(newComment);

    localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
    renderComments(comments);

    document.getElementById("comment-body").value = "";
    document.getElementById("comment-user").value = "";
}

// Uppdatera och spara reaktioner
function updateReactions() {
    document.getElementById('likes-count').textContent = post.reactions.likes;
    document.getElementById('dislikes-count').textContent = post.reactions.dislikes;
    document.getElementById('reactions-count').textContent = post.reactions.total || 0;

    const postIndex = posts.findIndex(p => p.id == postId);
    if (postIndex !== -1) {
        posts[postIndex] = post;
        localStorage.setItem('posts', JSON.stringify(posts));
    }
}

// Visa inlägget och lägg till event listeners
async function displayPost() {
    await fetchUsersIfNeeded();

    if (!post) return;

    const user = users.find(user => user.id == Number(post.userId));
    const username = user ? user.username : `Användare ${post.userId}`;

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

    fetchComments();
    populateUserDropdown();

    document.getElementById("comment-form").addEventListener("submit", addComment);
}

// Starta funktionerna
displayPost();

document.getElementById("back-to-home").addEventListener("click", () => {
    window.location.href = "index.html";
});
