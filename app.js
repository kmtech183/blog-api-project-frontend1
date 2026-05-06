// Import config (add this at the top of app.js)
// Note: You'll need to include config.js before app.js in index.html

const API_URL = window.CONFIG?.API_URL || "http://localhost:5000/api";
console.log(API_URL);
// State management
let currentView = "home";
let currentPostId = null;

// DOM Elements
const app = document.getElementById("app");

// Helper functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const stripHtml = (html) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const showLoading = () => {
  app.innerHTML = `
        <div class="flex justify-center items-center py-20">
            <div class="loading-spinner"></div>
        </div>
    `;
};

const showError = (message) => {
  app.innerHTML = `
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg fade-in" role="alert">
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-3 text-xl"></i>
                <div>
                    <p class="font-bold">Error</p>
                    <p>${message}</p>
                </div>
            </div>
        </div>
    `;
};

// API Calls
const api = {
  async getPosts() {
    const response = await fetch(`${API_URL}/posts`);
    if (!response.ok) throw new Error("Failed to fetch posts");
    return response.json();
  },

  async getPost(id) {
    const response = await fetch(`${API_URL}/posts/${id}`);
    if (!response.ok) throw new Error("Failed to fetch post");
    return response.json();
  },

  async getComments(postId) {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`);
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  },

  async addComment(postId, commentData) {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
    });
    if (!response.ok) throw new Error("Failed to add comment");
    return response.json();
  },
};

// View Components
const components = {
  homePage: (posts) => `
        <div class="space-y-8 fade-in">
            <div class="text-center mb-12">
                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Welcome to BlogSpace
                </h1>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    Discover stories, thinking, and expertise from writers on any topic.
                </p>
            </div>
            
            <div class="grid gap-8">
                ${
                  posts.length === 0
                    ? `
                    <div class="text-center py-12 bg-white rounded-lg shadow-sm">
                        <i class="fas fa-newspaper text-6xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500 text-lg">No posts yet. Check back soon!</p>
                    </div>
                `
                    : posts
                        .map(
                          (post) => `
                    <article class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                        <div class="p-6">
                            <div class="flex items-center text-sm text-gray-500 mb-3">
                                <i class="far fa-calendar-alt mr-2"></i>
                                <span>${formatDate(post.createdAt)}</span>
                                <span class="mx-2">•</span>
                                <i class="far fa-comment mr-2"></i>
                                <span>${post.comments?.length || 0} comments</span>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                                ${post.title}
                            </h2>
                            <p class="text-gray-600 mb-4 line-clamp-3">
                                ${stripHtml(post.content).substring(0, 200)}...
                            </p>
                            <button onclick="viewPost(${post.id})" 
                                    class="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition">
                                Read More
                                <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition"></i>
                            </button>
                        </div>
                    </article>
                `,
                        )
                        .join("")
                }
            </div>
        </div>
    `,

  postPage: (post, comments) => `
        <div class="fade-in">
            <button onclick="navigateTo('home')" 
                    class="mb-6 inline-flex items-center text-blue-600 hover:text-blue-700 transition">
                <i class="fas fa-arrow-left mr-2"></i>
                Back to all posts
            </button>
            
            <article class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="p-8">
                    <div class="flex items-center text-sm text-gray-500 mb-4">
                        <i class="far fa-calendar-alt mr-2"></i>
                        <span>${formatDate(post.createdAt)}</span>
                        ${
                          post.updatedAt !== post.createdAt
                            ? `
                            <span class="mx-2">•</span>
                            <i class="fas fa-edit mr-2"></i>
                            <span>Updated ${formatDate(post.updatedAt)}</span>
                        `
                            : ""
                        }
                    </div>
                    
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        ${post.title}
                    </h1>
                    
                    <div class="blog-content prose max-w-none">
                        ${post.content}
                    </div>
                </div>
            </article>
            
            <!-- Comments Section -->
            <div class="mt-12 bg-white rounded-xl shadow-sm p-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">
                    <i class="far fa-comments mr-3 text-blue-600"></i>
                    Comments (${comments.length})
                </h3>
                
                <!-- Comment Form -->
                <div class="mb-8 bg-gray-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Leave a comment</h4>
                    <form id="commentForm" onsubmit="submitComment(event, ${post.id})">
                        <div class="mb-4">
                            <label for="authorName" class="block text-sm font-medium text-gray-700 mb-2">
                                Name (optional)
                            </label>
                            <input type="text" 
                                   id="authorName" 
                                   name="authorName" 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="Your name">
                        </div>
                        <div class="mb-4">
                            <label for="commentText" class="block text-sm font-medium text-gray-700 mb-2">
                                Comment *
                            </label>
                            <textarea id="commentText" 
                                      name="commentText" 
                                      rows="3" 
                                      required
                                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Share your thoughts..."></textarea>
                        </div>
                        <button type="submit" 
                                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            Post Comment
                        </button>
                    </form>
                </div>
                
                <!-- Comments List -->
                <div class="space-y-6">
                    ${
                      comments.length === 0
                        ? `
                        <div class="text-center py-8 text-gray-500">
                            <i class="far fa-comment-dots text-4xl mb-2"></i>
                            <p>No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    `
                        : comments
                            .map(
                              (comment) => `
                        <div class="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                            <div class="flex items-start justify-between mb-2">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <i class="fas fa-user text-blue-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <span class="font-semibold text-gray-900">
                                            ${comment.authorName || "Anonymous"}
                                        </span>
                                        <span class="text-sm text-gray-500 ml-2">
                                            ${formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p class="text-gray-700 ml-11">${comment.text}</p>
                        </div>
                    `,
                            )
                            .join("")
                    }
                </div>
            </div>
        </div>
    `,

  aboutPage: () => `
        <div class="fade-in text-center">
            <div class="bg-white rounded-xl shadow-sm p-8">
                <i class="fas fa-blog text-6xl text-blue-600 mb-4"></i>
                <h1 class="text-3xl font-bold text-gray-900 mb-4">About BlogSpace</h1>
                <p class="text-gray-600 mb-6 max-w-2xl mx-auto">
                    BlogSpace is a platform for sharing ideas, stories, and expertise. 
                    We believe in the power of words to inspire, educate, and connect people 
                    from all walks of life.
                </p>
                <div class="grid md:grid-cols-3 gap-6 mt-8">
                    <div>
                        <i class="fas fa-lightbulb text-3xl text-blue-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-900 mb-1">Inspire</h3>
                        <p class="text-sm text-gray-600">Share ideas that spark change</p>
                    </div>
                    <div>
                        <i class="fas fa-graduation-cap text-3xl text-blue-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-900 mb-1">Learn</h3>
                        <p class="text-sm text-gray-600">Gain knowledge from experts</p>
                    </div>
                    <div>
                        <i class="fas fa-users text-3xl text-blue-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-900 mb-1">Connect</h3>
                        <p class="text-sm text-gray-600">Join meaningful conversations</p>
                    </div>
                </div>
            </div>
        </div>
    `,
};

// Navigation functions
window.navigateTo = (view) => {
  currentView = view;
  if (view === "home") {
    loadHomePage();
  } else if (view === "about") {
    renderAboutPage();
  }
};

window.viewPost = async (postId) => {
  currentView = "post";
  currentPostId = postId;
  await loadPostPage(postId);
};

window.submitComment = async (event, postId) => {
  event.preventDefault();

  const authorName = document.getElementById("authorName").value;
  const commentText = document.getElementById("commentText").value;

  if (!commentText.trim()) {
    alert("Please enter a comment");
    return;
  }

  try {
    await api.addComment(postId, {
      text: commentText,
      authorName: authorName || null,
    });

    // Clear form
    document.getElementById("commentForm").reset();

    // Reload post page to show new comment
    await loadPostPage(postId);
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Failed to add comment. Please try again.");
  }
};

// Page loaders
async function loadHomePage() {
  showLoading();
  try {
    const posts = await api.getPosts();
    app.innerHTML = components.homePage(posts);
  } catch (error) {
    console.error("Error loading posts:", error);
    showError("Failed to load posts. Please try again later.");
  }
}

async function loadPostPage(postId) {
  showLoading();
  try {
    const [post, comments] = await Promise.all([
      api.getPost(postId),
      api.getComments(postId),
    ]);
    app.innerHTML = components.postPage(post, comments);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error loading post:", error);
    showError("Failed to load post. Please try again later.");
  }
}

function renderAboutPage() {
  app.innerHTML = components.aboutPage();
}

// Router based on URL hash
function handleRouting() {
  const hash = window.location.hash.slice(1);

  if (hash === "about") {
    renderAboutPage();
    currentView = "about";
  } else if (hash.startsWith("post/")) {
    const postId = parseInt(hash.split("/")[1]);
    if (postId) {
      loadPostPage(postId);
      currentView = "post";
      currentPostId = postId;
    } else {
      loadHomePage();
    }
  } else {
    loadHomePage();
    currentView = "home";
  }
}

// Event listeners
window.addEventListener("load", () => {
  handleRouting();

  // Handle hash changes
  window.addEventListener("hashchange", handleRouting);

  // About link handler
  document.getElementById("aboutLink").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.hash = "about";
  });
});

// Make functions global for inline handlers
window.viewPost = viewPost;
window.navigateTo = navigateTo;
window.submitComment = submitComment;
