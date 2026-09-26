// MovieWatchlist - Back4App configuration
// Replace the two placeholders below with your Back4App values.
// NEVER put your Back4App Master Key in this file.

const PARSE_APPLICATION_ID = "Rp2JDiXDbFhx835E3GZ7efzNzj8LP5tzUQHcCz6v";
const PARSE_JAVASCRIPT_KEY = "KKfXfuabBGe1rfgb4fufjnZAIflssd4RSaBmHy3c";
const PARSE_SERVER_URL = "https://parseapi.back4app.com/";

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = PARSE_SERVER_URL;

let registerMode = false;

const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");
const showLogin = document.getElementById("show-login");
const showRegister = document.getElementById("show-register");
const logoutBtn = document.getElementById("logout-btn");
const welcome = document.getElementById("welcome");
const movieForm = document.getElementById("movie-form");
const movieMessage = document.getElementById("movie-message");
const movieList = document.getElementById("movie-list");
const refreshBtn = document.getElementById("refresh-btn");

showLogin.addEventListener("click", () => setAuthMode(false));
showRegister.addEventListener("click", () => setAuthMode(true));
authForm.addEventListener("submit", handleAuth);
logoutBtn.addEventListener("click", handleLogout);
movieForm.addEventListener("submit", createMovie);
refreshBtn.addEventListener("click", loadMovies);

function setAuthMode(isRegistering) {
  registerMode = isRegistering;
  authSubmit.textContent = registerMode ? "Register" : "Log In";
  showLogin.classList.toggle("active", !registerMode);
  showRegister.classList.toggle("active", registerMode);
  authMessage.textContent = "";
}

async function handleAuth(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    if (registerMode) {
      const user = new Parse.User();
      user.set("username", username);
      user.set("password", password);
      await user.signUp();
    } else {
      await Parse.User.logIn(username, password);
    }

    showApp();
  } catch (error) {
    authMessage.textContent = error.message;
  }
}

async function handleLogout() {
  try {
    await Parse.User.logOut();
    showAuth();
  } catch (error) {
    authMessage.textContent = error.message;
  }
}

function showApp() {
  const user = Parse.User.current();
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  welcome.textContent = `Logged in as ${user.get("username")}`;
  loadMovies();
}

function showAuth() {
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  authForm.reset();
  movieList.innerHTML = "";
}

async function loadMovies() {
  movieList.innerHTML = "<p>Loading...</p>";

  try {
    const Movie = Parse.Object.extend("Movie");
    const query = new Parse.Query(Movie);
    query.equalTo("user", Parse.User.current());
    query.descending("createdAt");

    const movies = await query.find();
    renderMovies(movies);
  } catch (error) {
    movieList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

function renderMovies(movies) {
  if (movies.length === 0) {
    movieList.innerHTML = "<p>Your watchlist is empty. Add your first movie!</p>";
    return;
  }

  movieList.innerHTML = "";

  movies.forEach(movie => {
    const wrapper = document.createElement("article");
    wrapper.className = `movie ${movie.get("status") === "Watched" ? "watched" : ""}`;

    const title = document.createElement("h3");
    title.textContent = movie.get("title");

    const meta = document.createElement("p");
    meta.className = "movie-meta";
    const year = movie.get("year") ? ` • ${movie.get("year")}` : "";
    const rating = movie.get("rating") !== null && movie.get("rating") !== undefined
      ? ` • Rating: ${movie.get("rating")}/10`
      : "";
    meta.textContent = `${movie.get("status")}${year}${rating}`;

    const notes = document.createElement("p");
    notes.textContent = movie.get("notes") || "";

    const actions = document.createElement("div");
    actions.className = "movie-actions";

    const statusButton = document.createElement("button");
    statusButton.textContent =
      movie.get("status") === "Watched" ? "Mark Want to Watch" : "Mark Watched";
    statusButton.onclick = () => toggleWatched(movie);

    const editButton = document.createElement("button");
    editButton.className = "secondary";
    editButton.textContent = "Edit";
    editButton.onclick = () => editMovie(movie);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteMovie(movie);

    actions.append(statusButton, editButton, deleteButton);
    wrapper.append(title, meta, notes, actions);
    movieList.appendChild(wrapper);
  });
}

async function createMovie(event) {
  event.preventDefault();

  const title = document.getElementById("movie-title").value.trim();
  const yearValue = document.getElementById("movie-year").value;
  const status = document.getElementById("movie-status").value;
  const ratingValue = document.getElementById("movie-rating").value;
  const notes = document.getElementById("movie-notes").value.trim();

  if (!title) return;

  try {
    const Movie = Parse.Object.extend("Movie");
    const movie = new Movie();

    movie.set("title", title);
    movie.set("year", yearValue ? Number(yearValue) : null);
    movie.set("status", status);
    movie.set("rating", ratingValue ? Number(ratingValue) : null);
    movie.set("notes", notes);
    movie.set("user", Parse.User.current());

    await movie.save();

    movieForm.reset();
    movieMessage.textContent = "";
    await loadMovies();
  } catch (error) {
    movieMessage.textContent = error.message;
  }
}

async function toggleWatched(movie) {
  try {
    movie.set(
      "status",
      movie.get("status") === "Watched" ? "Want to Watch" : "Watched"
    );
    await movie.save();
    await loadMovies();
  } catch (error) {
    movieMessage.textContent = error.message;
  }
}

async function editMovie(movie) {
  const title = prompt("Movie title:", movie.get("title"));
  if (title === null || !title.trim()) return;

  const year = prompt("Release year:", movie.get("year") || "");
  const status = prompt(
    "Status (Want to Watch, Watching, or Watched):",
    movie.get("status")
  );
  const rating = prompt("Your rating (0-10, optional):", movie.get("rating") ?? "");
  const notes = prompt("Notes:", movie.get("notes") || "");

  try {
    movie.set("title", title.trim());
    movie.set("year", year ? Number(year) : null);
    movie.set("status", status || "Want to Watch");
    movie.set("rating", rating ? Number(rating) : null);
    movie.set("notes", notes || "");

    await movie.save();
    await loadMovies();
  } catch (error) {
    movieMessage.textContent = error.message;
  }
}

async function deleteMovie(movie) {
  if (!confirm(`Remove "${movie.get("title")}" from your watchlist?`)) return;

  try {
    await movie.destroy();
    await loadMovies();
  } catch (error) {
    movieMessage.textContent = error.message;
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

if (Parse.User.current()) {
  showApp();
}
