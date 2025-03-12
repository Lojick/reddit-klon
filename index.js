document.addEventListener("DOMContentLoaded", async () => {
    let posts = JSON.parse(localStorage.getItem("posts")) || [];
    let users = []; // Global variabel för användare

    try {
        // ✅ Hämta användare först
        const usersResponse = await fetch("https://dummyjson.com/users?limit=0"); // Nu kan man få fram exakt alla användare
        const usersData = await usersResponse.json();
        users = usersData.users;
        window.users = users; // Uppdatera den globala variabeln
        console.log("✅ Användare hämtade:", users);

        // ✅ Fyll dropdown med användare
        const userSelect = document.getElementById("user-select");
        userSelect.innerHTML = '<option value="" disabled selected>Välj användare</option>';

        users.forEach(user => {
            let option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.username;
            userSelect.appendChild(option);
        });

        // ✅ Hämta inlägg efter att användarna laddats
        if (posts.length === 0) {
            const postsResponse = await fetch("https://dummyjson.com/posts");
            const postsData = await postsResponse.json();
            posts = postsData.posts;
            localStorage.setItem("posts", JSON.stringify(posts));
        }

        console.log("✅ Inlägg hämtade:", posts);
        console.log("✅ Användare innan rendering:", users);

        // ✅ Rendera inlägg med rätt användarnamn
        renderPosts(posts, users);
    } catch (error) {
        console.error("❌ Fel vid hämtning av data:", error);
    }

    // ✅ Lyssna på formuläret för att skapa nytt inlägg
    document.getElementById("post-form").addEventListener("submit", (e) => {
        e.preventDefault(); // Förhindra sidans omladdning

        // Hämta värden från formuläret
        const title = document.getElementById("post-title").value;
        const body = document.getElementById("post-body").value;
        const tags = document.getElementById("post-tags").value.split(",").map(tag => tag.trim());
        const userId = document.getElementById("user-select").value;

        if (!title || !body || !tags.length || !userId) {
            alert("Vänligen fyll i alla fält.");
            return;
        }

        // ✅ Skapa nytt inläggsobjekt
        let newPost = {
            id: Date.now(), // Unikt ID
            title: title,
            body: body,
            tags: tags,
            userId: Number(userId), // Se till att userId är ett nummer
            reactions: { likes: 0, dislikes: 0, total: 0 }
        };

        console.log("📝 Nytt inlägg skapat:", newPost);

        // ✅ Lägg till inlägget i listan och spara i localStorage
        posts.unshift(newPost);
        localStorage.setItem("posts", JSON.stringify(posts));

        // ✅ Uppdatera inläggslistan på sidan
        renderPosts(posts, users);

        // ✅ Rensa formuläret
        document.getElementById("post-form").reset();
    });
});

// ✅ Uppdaterad `renderPosts`-funktion med felsökning
function renderPosts(posts, users) {
    const postsContainer = document.getElementById("posts-container");
    postsContainer.innerHTML = "<h3>Senaste inläggen:</h3>";

    posts.forEach(post => {
        const postElement = document.createElement("div");
        postElement.classList.add("post");

        // ✅ Hitta rätt användarnamn baserat på userId
        const user = users.find(user => user.id == post.userId);
        const username = user ? user.username : `Användare ${post.userId}`;

        console.log(`🔍 Post-ID: ${post.id}, User-ID: ${post.userId}, Användare:`, user);

        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.body.substring(0, 60)}...</p>
            <p><strong>Taggar:</strong> ${post.tags.join(", ")}</p>
            <p><strong>Skapad av:</strong> ${username}</p> 
            <a href="post.html?id=${post.id}">Läs mer</a>
        `;

        postsContainer.appendChild(postElement);
    });
}

