document.addEventListener("DOMContentLoaded", async () => {
    let posts = JSON.parse(localStorage.getItem("posts")) || [];
    let users = [];

    try {
        // Hämtar alla användare och fyller dropdown-listan
        const usersResponse = await fetch("https://dummyjson.com/users?limit=0");
        const usersData = await usersResponse.json();
        users = usersData.users;

        const userSelect = document.getElementById("user-select");
        userSelect.innerHTML = '<option value="" disabled selected>Välj användare</option>';

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.username;
            userSelect.appendChild(option);
        });

        // Hämtar inlägg från API bara om inga finns sparade lokalt
        if (posts.length === 0) {
            const postsResponse = await fetch("https://dummyjson.com/posts");
            const postsData = await postsResponse.json();
            posts = postsData.posts;
            localStorage.setItem("posts", JSON.stringify(posts));
        }

        renderPosts(posts, users);
    } catch (error) {
        console.error("Fel vid hämtning av data:", error);
    }

    // Skapar nytt inlägg och uppdaterar både lokal lagring och gränssnittet
    document.getElementById("post-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("post-title").value;
        const body = document.getElementById("post-body").value;
        const tags = document.getElementById("post-tags").value.split(",").map(tag => tag.trim());
        const userId = document.getElementById("user-select").value;

        if (!title || !body || !tags.length || !userId) {
            alert("Vänligen fyll i alla fält.");
            return;
        }

        const newPost = {
            id: Date.now(), // Använder aktuell tid som unikt ID
            title: title,
            body: body,
            tags: tags,
            userId: Number(userId),
            reactions: { likes: 0, dislikes: 0, total: 0 }
        };

        posts.unshift(newPost);
        localStorage.setItem("posts", JSON.stringify(posts));
        renderPosts(posts, users);
        document.getElementById("post-form").reset();
    });
});

// Renderar inläggen tillsammans med tillhörande användarnamn
function renderPosts(posts, users) {
    const postsContainer = document.getElementById("posts-container");
    postsContainer.innerHTML = "<h3>Senaste inläggen:</h3>";

    posts.forEach(post => {
        const postElement = document.createElement("div");
        postElement.classList.add("post");

        const user = users.find(user => user.id === post.userId);
        const username = user ? user.username : `Användare ${post.userId}`;

        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.body.substring(0, 60)}...</p>
            <p><strong>Taggar:</strong> ${post.tags.join(", ")}</p>
            <p><strong>Skapad av:</strong> ${username}</p> 
            <a href="post.html?id=${post.id}" class="read-more-btn">Läs mer</a>
        `;

        postsContainer.appendChild(postElement);
    });
}
