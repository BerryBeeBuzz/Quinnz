function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.sidebar ul li a').forEach(link => link.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`a[onclick="showPage('${pageId}')"]`).classList.add('active');
  }
  
  // Mock ticket data for POC
  const mockTickets = [
    { _id: '1', title: 'Test Ticket', description: 'Test', impact: 'High', createdAt: '2025-05-03T01:25:52.849Z' },
    { _id: '2', title: 'Network Test Ticket', description: 'Test after network fix', impact: 'Low', createdAt: '2025-05-03T01:57:05.250Z' }
  ];
  
  // Update dashboard
  document.getElementById('open-tickets').textContent = mockTickets.length;
  document.getElementById('high-impact').textContent = mockTickets.filter(t => t.impact === 'High').length;
  const recentList = document.getElementById('recent-tickets');
  recentList.innerHTML = mockTickets.slice(0, 2).map(t => `<li>${t.title} - ${t.impact}</li>`).join('');
  
  // Chart
  const ctx = document.getElementById('ticketChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: 'Tickets Created',
        data: [10, 15, 8, 12, 5],
        borderColor: '#3498db',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
  
  // Ticket form submission (mock)
  document.getElementById('ticket-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const impact = document.getElementById('impact').value;
    alert(`Ticket created: ${title} (Impact: ${impact})`);
    document.getElementById('ticket-form').reset();
  });
  
  // Chat form (mock)
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.getElementById('chat-message').value;
    if (message) {
      const chatBox = document.getElementById('chat-box');
      chatBox.innerHTML += `<p>${message}</p>`;
      chatBox.scrollTop = chatBox.scrollHeight;
      document.getElementById('chat-message').value = '';
    }
  });
  
  // Show dashboard by default
  showPage('dashboard');