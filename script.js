import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Replace with your Firebase Config from Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyC5If0e-BfyC9aFENp_UjGmWl50FRQqPm8",
  authDomain: "exser-books.firebaseapp.com",
  projectId: "exser-books",
  storageBucket: "exser-books.firebasestorage.app",
  messagingSenderId: "27452327",
  appId: "1:27452327:web:ef00bb74fd3ab996d74c82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "campameurer@gmail.com";

let allBooks = [];
let isAdmin = false;

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');

    if (user && user.email === ADMIN_EMAIL) {
        isAdmin = true;
        adminPanel.style.display = 'block';
        userInfo.innerText = user.email;
        loginBtn.innerText = "Logout";
        loginBtn.onclick = () => signOut(auth).then(() => location.reload());
    } else {
        isAdmin = false;
        adminPanel.style.display = 'none';
        userInfo.innerText = "";
        loginBtn.innerText = "Admin Login";
        loginBtn.onclick = () => signInWithPopup(auth, provider);
    }
    loadBooks();
});

// --- SAVE BOOK ---
window.saveBook = async () => {
    const title = document.getElementById('book-title').value;
    const category = document.getElementById('book-category').value;
    const link = document.getElementById('book-link').value;

    if (!title || !link) return alert("Title and Link are required!");

    try {
        await addDoc(collection(db, "books"), {
            title,
            category: category || "General",
            ebookUrl: link,
            createdAt: new Date()
        });
        alert("Book published!");
        location.reload();
    } catch (e) {
        alert("Error: " + e.message);
    }
};

// --- DELETE BOOK ---
window.deleteBook = async (e, id) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this book?")) {
        await deleteDoc(doc(db, "books", id));
        location.reload();
    }
};

// --- LOAD BOOKS ---
async function loadBooks() {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const grid = document.getElementById('books-grid');
    grid.innerHTML = "";
    allBooks = [];

    snap.forEach(docSnap => {
        const book = docSnap.data();
        const id = docSnap.id;
        allBooks.push({ ...book, id });
        renderBook(book, id);
    });
}

function renderBook(book, id) {
    const grid = document.getElementById('books-grid');
    grid.innerHTML += `
        <div class="book-card" onclick="window.open('${book.ebookUrl}', '_blank')">
            ${isAdmin ? `<button class="btn-delete" style="display:block" onclick="deleteBook(event, '${id}')">DELETE</button>` : ''}
            <h3>${book.title}</h3>
            <p>${book.category}</p>
        </div>
    `;
}

// --- SEARCH FILTER ---
window.filterBooks = () => {
    const term = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('books-grid');
    grid.innerHTML = "";
    allBooks.forEach(book => {
        if (book.title.toLowerCase().includes(term) || book.category.toLowerCase().includes(term)) {
            renderBook(book, book.id);
        }
    });
};
