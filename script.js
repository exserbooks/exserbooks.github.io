import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- PASTE YOUR CONFIG FROM FIREBASE PROJECT SETTINGS HERE ---
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

// AUTH OBSERVER
onAuthStateChanged(auth, (user) => {
    isAdmin = user && user.email === ADMIN_EMAIL;
    document.getElementById('admin-panel').style.display = isAdmin ? 'block' : 'none';
    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerText = user ? "Logout" : "Admin Login";
    loginBtn.onclick = user ? () => signOut(auth).then(() => location.reload()) : () => signInWithPopup(auth, provider);
    loadBooks();
});

// SAVE NEW BOOK
window.saveBook = async () => {
    const title = document.getElementById('book-title').value;
    const category = document.getElementById('book-category').value;
    const link = document.getElementById('book-link').value;

    if (!title || !link) return alert("Please fill title and link!");

    try {
        await addDoc(collection(db, "books"), {
            title, category: category || "General", ebookUrl: link,
            ratings: [], createdAt: new Date()
        });
        location.reload();
    } catch (e) { alert(e.message); }
};

// RATE BOOK FUNCTION
window.rateBook = async (bookId, score) => {
    const bookRef = doc(db, "books", bookId);
    await updateDoc(bookRef, { ratings: arrayUnion(score) });
    alert("Rating saved! Thank you.");
    loadBooks();
};

// DELETE BOOK
window.deleteBook = async (e, id) => {
    e.stopPropagation();
    if (confirm("Delete this book permanently?")) {
        await deleteDoc(doc(db, "books", id));
        loadBooks();
    }
};

// FETCH BOOKS
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

// RENDER INDIVIDUAL CARD
function renderBook(book, id) {
    const ratings = book.ratings || [];
    const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "0.0";
    const grid = document.getElementById('books-grid');
    
    grid.innerHTML += `
        <div class="book-card">
            ${isAdmin ? `<button class="btn-delete" onclick="deleteBook(event, '${id}')">DELETE</button>` : ''}
            <div class="book-info-area" onclick="window.open('${book.ebookUrl}', '_blank')">
                <h3>${book.title}</h3>
                <p>${book.category}</p>
            </div>
            <div class="rating-section">
                <div class="stars">
                    ${[1, 2, 3, 4, 5].map(num => `
                        <span class="star ${num <= Math.round(avg) ? 'active' : ''}" 
                              onclick="rateBook('${id}', ${num})">★</span>
                    `).join('')}
                </div>
                <span class="avg-label">Avg: ${avg} (${ratings.length} reviews)</span>
            </div>
        </div>
    `;
}

// SEARCH
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
