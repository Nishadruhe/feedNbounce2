// ✅ app.js for FeedNBounce (Node + MongoDB backend)

const API_BASE = "http://localhost:5001/api";
let isGuestMode = true;

function getToken() {
  return localStorage.getItem("token");
}

// -------------------- LOGIN --------------------
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login_email").value.trim();
  const password = document.getElementById("login_password").value.trim();
  const role = document.getElementById("login_role").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Login failed");

    if (data.token) localStorage.setItem("token", data.token);

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "feedback.html";
    }
  } catch (err) {
    alert("Login error: " + err.message);
  }
});

// -------------------- REGISTER --------------------
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("reg_name").value.trim();
  const email = document.getElementById("reg_email").value.trim();
  const password = document.getElementById("reg_password").value.trim();
  const role = document.getElementById("reg_role").value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Register failed");

    alert(`Registration successful! Your User ID: ${data.user_id}`);
    window.location.href = "login.html";
  } catch (err) {
    alert("Register error: " + err.message);
  }
});

// -------------------- USER TYPE SELECTOR --------------------
document.getElementById("guestBtn")?.addEventListener("click", () => {
  isGuestMode = true;
  document.getElementById("guestBtn").classList.add("active");
  document.getElementById("userBtn").classList.remove("active");
  document.getElementById("navLinks").style.display = "none";
  document.getElementById("loginPrompt").style.display = "none";
});

document.getElementById("userBtn")?.addEventListener("click", () => {
  const token = getToken();
  if (!token) {
    document.getElementById("loginPrompt").style.display = "block";
    return;
  }
  
  isGuestMode = false;
  document.getElementById("userBtn").classList.add("active");
  document.getElementById("guestBtn").classList.remove("active");
  document.getElementById("navLinks").style.display = "flex";
  document.getElementById("loginPrompt").style.display = "none";
});

// -------------------- FEEDBACK FORM --------------------
const products = ["Apple iPhone 15", "Samsung Galaxy S24", "HP Pavilion", "OnePlus 12"];
const services = ["Installation", "Maintenance", "Customer Support", "Warranty"];

function populateItems(category) {
  const itemSelect = document.getElementById("itemSelect");
  if (!itemSelect) return;
  itemSelect.innerHTML = `<option value="">Select Item</option>`;
  const items = category === "product" ? products : services;
  items.forEach((it) => {
    const opt = document.createElement("option");
    opt.value = it;
    opt.textContent = it;
    itemSelect.appendChild(opt);
  });
}

document.getElementById("categorySelect")?.addEventListener("change", (e) => {
  populateItems(e.target.value);
});

// Submit feedback
document.getElementById("submitFeedback")?.addEventListener("click", async () => {
  const category = document.getElementById("categorySelect").value;
  const item_name = document.getElementById("itemSelect").value;
  const message = document.getElementById("messageInput").value.trim();

  if (!category || !item_name || !message) {
    alert("Please complete all fields.");
    return;
  }

  try {
    let res, endpoint;
    
    if (isGuestMode) {
      // Guest submission
      endpoint = `${API_BASE}/feedback/guest`;
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, item_name, message }),
      });
    } else {
      // Registered user submission
      const token = getToken();
      if (!token) {
        alert("Please login to submit as registered user.");
        return;
      }
      
      endpoint = `${API_BASE}/feedback`;
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category, item_name, message }),
      });
    }

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Feedback submission failed");
    
    const submitBtn = document.getElementById('submitFeedback');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = '✓ Submitted!';
    submitBtn.style.background = '#22c55e';
    
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
    }, 3000);
    
    document.getElementById("categorySelect").value = "";
    document.getElementById("itemSelect").innerHTML = `<option value="" disabled selected>Select Category First</option>`;
    document.getElementById("messageInput").value = "";
    
  } catch (err) {
    alert("Submit error: " + err.message);
  }
});

// -------------------- LOAD USER HISTORY --------------------
async function loadHistory() {
  const historyContainer = document.getElementById("historyList");
  const token = getToken();
  if (!historyContainer || !token) return;

  try {
    const res = await fetch(`${API_BASE}/feedback/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>No feedback yet</h3>
          <p>Start sharing your thoughts!</p>
        </div>`;
      return;
    }

    updateHistoryStats(data);

    historyContainer.innerHTML = data
      .map((f, index) => {
        const sentiment = getSentiment(f.message);
        return `
          <div class="feedback-item" data-category="${f.category}" data-sentiment="${sentiment.toLowerCase()}" style="animation-delay: ${index * 0.1}s">
            <div class="feedback-header">
              <span class="feedback-category">${f.category}</span>
              <span class="feedback-date">${new Date(f.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="feedback-title">${f.item_name}</div>
            <div class="feedback-message">${f.message}</div>
            <span class="feedback-sentiment sentiment-${sentiment.toLowerCase()}">${sentiment}</span>
          </div>`;
      })
      .join("");

    setupHistoryFilters();
  } catch (err) {
    historyContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading history</h3>
        <p>Please try again later</p>
      </div>`;
  }
}

function getSentiment(message) {
  const text = message.toLowerCase();
  if (text.includes('good') || text.includes('excellent') || text.includes('great') || text.includes('awesome') || text.includes('amazing') || text.includes('satisfied') || text.includes('better')) {
    return 'positive';
  } else if (text.includes('bad') || text.includes('poor') || text.includes('terrible') || text.includes('worst')) {
    return 'negative';
  }
  return 'neutral';
}

function updateHistoryStats(data) {
  const totalEl = document.getElementById('totalCount');
  const positiveEl = document.getElementById('positiveCount');
  const negativeEl = document.getElementById('negativeCount');
  
  if (totalEl) totalEl.textContent = data.length;
  
  let positive = 0, negative = 0;
  data.forEach(f => {
    const sentiment = getSentiment(f.message);
    if (sentiment === 'positive') positive++;
    if (sentiment === 'negative') negative++;
  });
  
  if (positiveEl) positiveEl.textContent = positive;
  if (negativeEl) negativeEl.textContent = negative;
}

function setupHistoryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const feedbackItems = document.querySelectorAll('.feedback-item');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      
      feedbackItems.forEach((item, index) => {
        const shouldShow = filter === 'all' || 
                          item.dataset.category === filter || 
                          item.dataset.sentiment === filter;
        
        if (shouldShow) {
          item.style.display = 'block';
          item.style.animationDelay = `${index * 0.05}s`;
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Check if user is logged in on page load
if (window.location.pathname.endsWith("feedback.html")) {
  const token = getToken();
  if (token) {
    isGuestMode = false;
    document.getElementById("userBtn")?.classList.add("active");
    document.getElementById("guestBtn")?.classList.remove("active");
  } else {
    document.getElementById("navLinks").style.display = "none";
  }
}

if (document.getElementById("historyList")) loadHistory();

// -------------------- ADMIN DASHBOARD --------------------
let currentChart = null;
let currentCategoryChart = null;
let allFeedbacks = [];

async function loadAdminDashboard() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "login.html");

  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const [feedbackRes, sentimentRes] = await Promise.all([
      fetch(`${API_BASE}/admin/feedbacks`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/admin/sentiments`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const feedbacks = await feedbackRes.json();
    const sentiments = await sentimentRes.json();
    allFeedbacks = feedbacks;

    animateCounter('totalFeedbacks', feedbacks.length || 0);
    animateCounter('positiveCount', sentiments.positive || 0);
    animateCounter('neutralCount', sentiments.neutral || 0);
    animateCounter('negativeCount', sentiments.negative || 0);

    const total = feedbacks.length || 1;
    document.getElementById('positivePercent').textContent = `${Math.round((sentiments.positive / total) * 100)}%`;
    document.getElementById('neutralPercent').textContent = `${Math.round((sentiments.neutral / total) * 100)}%`;
    document.getElementById('negativePercent').textContent = `${Math.round((sentiments.negative / total) * 100)}%`;

    createSentimentChart(sentiments);
    createCategoryChart(feedbacks);
    loadFeedbackCards(feedbacks);
    setupChartControls(sentiments);
    setupFeedbackFilters();

  } catch (err) {
    console.error("Admin dashboard failed:", err);
  }
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const startValue = 0;
  const duration = 1000;
  const startTime = performance.now();
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

function createSentimentChart(sentiments) {
  const ctx = document.getElementById("chartSentiment")?.getContext("2d");
  if (!ctx) return;
  
  if (currentChart) {
    currentChart.destroy();
  }
  
  currentChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Positive", "Neutral", "Negative"],
      datasets: [{
        data: [sentiments.positive, sentiments.neutral, sentiments.negative],
        backgroundColor: ["#38ef7d", "#f5576c", "#ee5a24"],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
}

function createCategoryChart(feedbacks) {
  const ctx = document.getElementById("categoryChart")?.getContext("2d");
  if (!ctx) return;
  
  if (currentCategoryChart) {
    currentCategoryChart.destroy();
  }
  
  const productCount = feedbacks.filter(f => f.category === 'product').length;
  const serviceCount = feedbacks.filter(f => f.category === 'service').length;
  
  currentCategoryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Products", "Services"],
      datasets: [{
        label: "Feedback Count",
        data: [productCount, serviceCount],
        backgroundColor: ["rgba(107, 62, 220, 0.8)", "rgba(145, 104, 247, 0.8)"],
        borderColor: ["#6b3edc", "#9168f7"],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function setupChartControls(sentiments) {
  const chartBtns = document.querySelectorAll('.chart-btn');
  
  chartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chartBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const chartType = btn.dataset.chart;
      if (currentChart) {
        currentChart.destroy();
      }
      
      const ctx = document.getElementById("chartSentiment").getContext("2d");
      currentChart = new Chart(ctx, {
        type: chartType,
        data: {
          labels: ["Positive", "Neutral", "Negative"],
          datasets: [{
            data: [sentiments.positive, sentiments.neutral, sentiments.negative],
            backgroundColor: ["#38ef7d", "#f5576c", "#ee5a24"],
            borderWidth: chartType === 'bar' ? 2 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: chartType === 'bar' ? 'top' : 'bottom'
            }
          }
        }
      });
    });
  });
}

function loadFeedbackCards(feedbacks) {
  const container = document.getElementById('adminFeedbackGrid');
  
  if (!feedbacks.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No feedback yet</h3>
        <p>Feedback will appear here once users start submitting.</p>
      </div>`;
    return;
  }
  
  container.innerHTML = feedbacks.map(f => {
    const sentiment = getSentiment(f.message);
    const userName = f.user_info?.name;
    const userInitial = userName.charAt(0).toUpperCase();
    const userType = f.user_info?.type || 'unknown';
    
    return `
      <div class="admin-feedback-card" data-sentiment="${sentiment.toLowerCase()}">
        <div class="feedback-user">
          <div class="user-avatar">${userInitial}</div>
          <div class="user-info">
            <h4>${userName} ${userType === 'guest' ? '<span class="guest-badge">GUEST</span>' : ''}</h4>
            <p class="user-id-display">ID: ${f.user_id}</p>
            <p>${new Date(f.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="feedback-content">
          <span class="feedback-category-badge">${f.category.toUpperCase()}</span>
          <div class="feedback-text">${f.message}</div>
        </div>
        
        <div class="feedback-meta">
          <span class="feedback-date">${f.item_name}</span>
          <span class="sentiment ${sentiment.toLowerCase()}">${sentiment}</span>
        </div>
      </div>`;
  }).join('');
}

function setupFeedbackFilters() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll('.admin-feedback-card');
      
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.sentiment === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

if (document.getElementById("adminFeedbackGrid")) {
  loadAdminDashboard();
}

// -------------------- LOGOUT --------------------
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  alert("Logged out successfully!");
  window.location.href = "login.html";
});