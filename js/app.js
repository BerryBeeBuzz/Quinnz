document.addEventListener('DOMContentLoaded', () => {
  // Page navigation
  const pages = document.querySelectorAll('.page');
  const menuItems = document.querySelectorAll('.menu-item');
  const dashboardCreateBtn = document.querySelector('.cta-btn[onclick*="showPage("]');
  const sidebarCreateBtn = document.querySelector('.create-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  function showToast(message) {
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2500);
    }
  }

  function showPage(pageId) {
    console.log(`[NAV] called with pageId: ${pageId}`);
    try {
      console.log(`[NAV] pages: ${Array.from(pages).map(p => p.id).join(', ')}`);
      pages.forEach(page => {
        const isVisible = page.id === pageId;
        page.style.display = isVisible ? 'block' : 'none';
        console.log(`[NAV] Page ${page.id} display: ${page.style.display}`);
      });
      console.log(`[NAV] menu items: ${Array.from(menuItems).map(m => m.textContent.trim()).join(', ')}`);
      menuItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick') || '';
        const isActive = onclickAttr.includes(`showPage('${pageId}')`);
        item.classList.toggle('active', isActive);
        console.log(`[NAV] Menu '${item.textContent.trim()}' active: ${isActive}`);
      });
      if (pageId === 'dashboard' && window.grid) {
        console.log('[NAV] Refreshing grid');
        window.grid.refreshItems().layout();
      }
      if (pageId === 'integrations') {
        renderIntegrationsList();
      }
    } catch (error) {
      console.error('[NAV] Error:', error);
    }
  }

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const onclickAttr = item.getAttribute('onclick') || '';
      const match = onclickAttr.match(/showPage\('([^']+)'\)/);
      if (match) {
        console.log(`[NAV] Clicked: ${match[1]}`);
        showPage(match[1]);
      } else {
        console.warn(`[NAV] No match: ${item.textContent.trim()}`);
      }
    });
  });

  if (dashboardCreateBtn) {
    dashboardCreateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[NAV] Dashboard create clicked');
      showPage('incidents');
    });
  }

  if (sidebarCreateBtn) {
    sidebarCreateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[NAV] Sidebar create clicked');
      showPage('incidents');
    });
  }

  // Sidebar toggle
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggleBtn = document.querySelector('#toggle-btn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('collapsed');
      if (window.grid) {
        window.grid.refreshItems().layout();
      }
    });
  }

  // Dashboard functionality
  window.pageContact = function(name, team) {
    showToast(`Paging ${name} for ${team} team...`);
  };

  // Initialize Muuri grid
  try {
    window.grid = new Muuri('.widget-grid.muuri', {
      dragEnabled: true,
      layout: {
        fillGaps: false,
        horizontal: false,
        alignRight: false,
        alignBottom: false,
        rounding: false
      }
    });
    window.grid.refreshItems().layout();
    window.addEventListener('resize', () => {
      window.grid.refreshItems().layout();
    });
  } catch (error) {
    console.error('Muuri init failed:', error);
  }

  const addWidgetBtn = document.querySelector('.add-widget-btn');
  if (addWidgetBtn) {
    addWidgetBtn.addEventListener('click', () => {
      const newWidget = document.createElement('div');
      newWidget.className = 'widget muuri-item uniform';
      newWidget.innerHTML = `
        <div class="muuri-item-content">
          <h3>New Widget</h3>
          <p>Placeholder content</p>
        </div>
      `;
      window.grid.add(newWidget, { index: -1, layout: true });
      showToast('Widget added');
    });
  }

  // Dashboard charts
  try {
    const charts = [
      {
        id: 'incidentChart',
        type: 'pie',
        data: {
          labels: ['Open', 'In Progress', 'Resolved'],
          datasets: [{ data: [15, 8, 22], backgroundColor: ['#60A5FA', '#FBBF24', '#22C55E'], borderWidth: 1 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      },
      {
        id: 'priorityChart',
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            { label: 'P1 High', data: [5, 3, 4, 2, 1], borderColor: '#EF4444', fill: true },
            { label: 'P2 Medium', data: [10, 8, 7, 9, 6], borderColor: '#FBBF24', fill: true },
            { label: 'P3 Low', data: [15, 12, 14, 11, 13], borderColor: '#60A5FA', fill: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      },
      {
        id: 'slaChart',
        type: 'doughnut',
        data: {
          labels: ['On Track', 'At Risk'],
          datasets: [{ data: [92, 8], backgroundColor: ['#22C55E', '#EF4444'], borderWidth: 1 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      },
      {
        id: 'dynatraceChart',
        type: 'line',
        data: {
          labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM'],
          datasets: [{ label: 'CPU Usage (%)', data: [20, 30, 25, 40, 35], borderColor: '#4F46E5', fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      },
      {
        id: 'splunkChart',
        type: 'line',
        data: {
          labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM'],
          datasets: [{ label: 'Error Rate', data: [5, 10, 8, 12, 7], borderColor: '#EF4444', fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      },
      {
        id: 'changeTicketsChart',
        type: 'bar',
        data: {
          labels: ['Open', 'In Review', 'Approved'],
          datasets: [{ label: 'Change Tickets', data: [10, 5, 3], backgroundColor: '#4F46E5' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      },
      {
        id: 'pagerDutyChart',
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [{ label: 'Incidents', data: [3, 5, 2, 4, 1], borderColor: '#FBBF24', fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      },
      {
        id: 'responseTimeChart',
        type: 'bar',
        data: {
          labels: ['P1', 'P2', 'P3'],
          datasets: [{ label: 'Response Time (min)', data: [10, 20, 30], backgroundColor: '#60A5FA' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      },
      {
        id: 'serviceHealthChart',
        type: 'bar',
        data: {
          labels: ['P1', 'P2', 'P3'],
          datasets: [{ label: 'Incidents', data: [3, 5, 7], backgroundColor: ['#EF4444', '#FBBF24', '#60A5FA'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      }
    ];

    charts.forEach(chart => {
      const canvas = document.getElementById(chart.id);
      if (canvas) {
        new Chart(canvas.getContext('2d'), {
          type: chart.type,
          data: chart.data,
          options: chart.options
        });
      } else {
        console.warn(`Canvas #${chart.id} not found`);
      }
    });
  } catch (error) {
    console.error('Chart init failed:', error);
  }

  // Incidents (Ticket Form)
  const form = document.getElementById('incident-form');
  const userProfileSelect = document.getElementById('user-profile');
  const userNameInput = document.getElementById('user-name');
  const locationInput = document.getElementById('location');
  const contactNumberInput = document.getElementById('contact-number');
  const appServiceSelect = document.getElementById('app-service');
  const priorityInput = document.getElementById('priority');
  const impactSelect = document.getElementById('impact');
  const urgencySelect = document.getElementById('urgency');
  const assignmentGroupInput = document.getElementById('assignment-group');
  const categoryInput = document.getElementById('category');
  const shortDescriptionInput = document.getElementById('short-description');
  const businessImpactTextarea = document.getElementById('business-impact');
  const ticketNumberInput = document.getElementById('ticket-number');

  let ticketCounter = parseInt(localStorage.getItem('ticketCounter')) || 0;
  let currentTicketNumber = null;

  const userProfiles = {
    'alice-johnson': { userName: 'Alice Johnson', location: 'New York, NY', contactNumber: '212-555-0101' },
    'bob-smith': { userName: 'Bob Smith', location: 'Chicago, IL', contactNumber: '312-555-0202' },
    'clara-lee': { userName: 'Clara Lee', location: 'San Francisco, CA', contactNumber: '415-555-0303' },
    'david-brown': { userName: 'David Brown', location: 'Austin, TX', contactNumber: '512-555-0404' },
    'Jack-Berry': { userName: 'Jack Berry', location: 'Sandy, UT', contactNumber: '801-803-0608' }
  };

  const priorityMatrix = {
    'High-High': 'P1 High',
    'High-Medium': 'P2 Medium',
    'High-Low': 'P3 Low',
    'Medium-High': 'P2 Medium',
    'Medium-Medium': 'P2 Medium',
    'Medium-Low': 'P3 Low',
    'Low-High': 'P3 Low',
    'Low-Medium': 'P3 Low',
    'Low-Low': 'P4 Low'
  };

  const priorityRank = {
    'P1 High': 1,
    'P2 Medium': 2,
    'P3 Low': 3,
    'P4 Low': 4
  };

  const autoPopulateData = {
    'citrix-storefront': {
      assignmentGroup: 'Citrix Team',
      category: 'Application Failure',
      shortDescription: 'Employees unable to access Citrix Storefront and virtual apps',
      businessImpact: 'Staff and external partners are unable to access Citrix Storefront and their associated virtual applications and desktops.',
      impact: 'High',
      urgency: 'High',
      priorityCap: 'P1 High'
    },
    'email-service': {
      assignmentGroup: 'Email Team',
      category: 'Service Disruption',
      shortDescription: 'Email service outage affecting users',
      businessImpact: 'Users cannot send or receive emails, impacting communication.',
      impact: 'High',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'server-cluster-a': {
      assignmentGroup: 'Server Team',
      category: 'Hardware Failure',
      shortDescription: 'Server Cluster A down',
      businessImpact: 'Critical services hosted on Server Cluster A are unavailable.',
      impact: 'High',
      urgency: 'High',
      priorityCap: 'P1 High'
    },
    'printer-service': {
      assignmentGroup: 'IT Support',
      category: 'Peripheral Issue',
      shortDescription: 'Printer service not responding',
      businessImpact: 'Users cannot print documents, affecting workflow.',
      impact: 'Low',
      urgency: 'Low',
      priorityCap: 'P4 Low'
    },
    'billing-app': {
      assignmentGroup: 'Billing Team',
      category: 'Application Issue',
      shortDescription: 'Billing application errors',
      businessImpact: 'Billing processes delayed, impacting financial operations.',
      impact: 'Medium',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'network-router': {
      assignmentGroup: 'Network Team',
      category: 'Network Failure',
      shortDescription: 'Network router offline',
      businessImpact: 'Network connectivity disrupted, affecting multiple services.',
      impact: 'High',
      urgency: 'High',
      priorityCap: 'P1 High'
    },
    'helpdesk-portal': {
      assignmentGroup: 'Helpdesk Team',
      category: 'Portal Issue',
      shortDescription: 'Helpdesk portal inaccessible',
      businessImpact: 'Users cannot submit or track support tickets.',
      impact: 'Medium',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'database-b': {
      assignmentGroup: 'Database Team',
      category: 'Database Failure',
      shortDescription: 'Database B connection errors',
      businessImpact: 'Applications relying on Database B are non-functional.',
      impact: 'High',
      urgency: 'High',
      priorityCap: 'P1 High'
    },
    'vpn-service': {
      assignmentGroup: 'Network Team',
      category: 'Service Disruption',
      shortDescription: 'VPN service unavailable',
      businessImpact: 'Remote users cannot access internal resources.',
      impact: 'High',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'file-server': {
      assignmentGroup: 'Server Team',
      category: 'Storage Issue',
      shortDescription: 'File server access denied',
      businessImpact: 'Users cannot access shared files, impacting collaboration.',
      impact: 'Medium',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'sap-erp': {
      assignmentGroup: 'ERP Team',
      category: 'Application Failure',
      shortDescription: 'SAP ERP system errors',
      businessImpact: 'Business processes disrupted, affecting operations.',
      impact: 'High',
      urgency: 'High',
      priorityCap: 'P1 High'
    },
    'zoom-service': {
      assignmentGroup: 'Communication Team',
      category: 'Service Disruption',
      shortDescription: 'Zoom service outage',
      businessImpact: 'Virtual meetings cannot be conducted.',
      impact: 'Medium',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'aws-lambda': {
      assignmentGroup: 'Cloud Team',
      category: 'Cloud Service Issue',
      shortDescription: 'AWS Lambda functions failing',
      businessImpact: 'Serverless applications impacted.',
      impact: 'Medium',
      urgency: 'Medium',
      priorityCap: 'P2 Medium'
    },
    'password-reset': {
      assignmentGroup: 'Helpdesk Team',
      category: 'Access Issue',
      shortDescription: 'Password reset requests not processing',
      businessImpact: 'Users locked out of accounts, affecting productivity.',
      impact: 'Low',
      urgency: 'Low',
      priorityCap: 'P3 Low'
    },
    'Access Request': {
      assignmentGroup: 'Security Team',
      category: 'Access Issue',
      shortDescription: 'Access request delays',
      businessImpact: 'New users cannot access systems, delaying onboarding.',
      impact: 'Low',
      urgency: 'Low',
      priorityCap: 'P3 Low'
    }
  };

  const formatTicketNumber = (num) => `INC${String(num).padStart(6, '0')}`;

  const updatePriority = () => {
    const selectedApp = appServiceSelect.value;
    const selectedImpact = impactSelect.value;
    const selectedUrgency = urgencySelect.value;
    const data = autoPopulateData[selectedApp] || {};
    const priorityCap = data.priorityCap || 'P4 Low';
    const key = `${selectedImpact}-${selectedUrgency}`;
    let priority = priorityMatrix[key] || 'P4 Low';
    if (priorityRank[priority] < priorityRank[priorityCap]) {
      priority = priorityCap;
    }
    priorityInput.value = priority;
  };

  if (appServiceSelect) {
    appServiceSelect.addEventListener('change', () => {
      const selectedApp = appServiceSelect.value;
      const data = autoPopulateData[selectedApp] || {};
      assignmentGroupInput.value = data.assignmentGroup || '';
      categoryInput.value = data.category || '';
      shortDescriptionInput.value = data.shortDescription || '';
      businessImpactTextarea.value = data.businessImpact || '';
      impactSelect.value = data.impact || '';
      urgencySelect.value = data.urgency || '';
      if (selectedApp && !currentTicketNumber) {
        currentTicketNumber = formatTicketNumber(ticketCounter);
        ticketNumberInput.value = currentTicketNumber;
      } else if (!selectedApp) {
        ticketNumberInput.value = 'Pending';
      } else {
        ticketNumberInput.value = currentTicketNumber || 'Pending';
      }
      updatePriority();
    });
  }

  if (impactSelect) impactSelect.addEventListener('change', updatePriority);
  if (urgencySelect) urgencySelect.addEventListener('change', updatePriority);

  if (userProfileSelect) {
    userProfileSelect.addEventListener('change', () => {
      const selectedUser = userProfileSelect.value;
      const userData = userProfiles[selectedUser] || {};
      userNameInput.value = userData.userName || '';
      locationInput.value = userData.location || '';
      contactNumberInput.value = userData.contactNumber || '';
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!businessImpactTextarea.value || !impactSelect.value || !urgencySelect.value) {
        showToast('Business Impact, Impact, and Urgency required');
        return;
      }
      let ticketNumber = currentTicketNumber || formatTicketNumber(ticketCounter);
      ticketNumberInput.value = ticketNumber;
      const formData = {
        ticketNumber,
        userProfile: userProfileSelect.value,
        userName: userNameInput.value,
        location: locationInput.value,
        contactNumber: contactNumberInput.value,
        application: appServiceSelect.value,
        priority: priorityInput.value,
        impact: impactSelect.value,
        urgency: urgencySelect.value,
        assignmentGroup: assignmentGroupInput.value,
        category: categoryInput.value,
        shortDescription: shortDescriptionInput.value,
        additionalComments: document.getElementById('additional-comments').value,
        businessImpact: businessImpactTextarea.value,
        workNotes: document.getElementById('work-notes').value,
        state: document.getElementById('state').value
      };
      console.log('Incident:', formData);
      showToast(`Incident created. Ticket: ${ticketNumber}`);
      ticketCounter++;
      localStorage.setItem('ticketCounter', ticketCounter);
      form.reset();
      currentTicketNumber = null;
      ticketNumberInput.value = 'Pending';
      userProfileSelect.dispatchEvent(new Event('change'));
      appServiceSelect.dispatchEvent(new Event('change'));
    });
  }

  // Settings
  const loginContainer = document.getElementById('login-container');
  const settingsContainer = document.getElementById('settings-container');
  const loginForm = document.getElementById('login-form');
  const userForm = document.getElementById('user-form');
  const appForm = document.getElementById('app-form');
  const userTableBody = document.getElementById('user-table-body');
  const appTableBody = document.getElementById('app-table-body');
  const logoutBtn = document.getElementById('logout-btn');

  const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

  let userProfilesSettings = JSON.parse(localStorage.getItem('userProfiles')) || {
    'alice-johnson': { userName: 'Alice Johnson', location: 'New York, NY', email: 'alice.johnson@example.com', contactNumber: '212-555-0101', jobTitle: 'Manager' },
    'bob-smith': { userName: 'Bob Smith', location: 'Chicago, IL', email: 'bob.smith@example.com', contactNumber: '312-555-0202', jobTitle: 'Technician' },
    'clara-lee': { userName: 'Clara Lee', location: 'San Francisco, CA', email: 'clara.lee@example.com', contactNumber: '415-555-0303', jobTitle: 'Analyst' },
    'david-brown': { userName: 'David Brown', location: 'Austin, TX', email: 'david.brown@example.com', contactNumber: '512-555-0404', jobTitle: 'Engineer' },
    'Jack-Berry': { userName: 'Jack Berry', location: 'Sandy, UT', email: 'jack.berry@example.com', contactNumber: '801-803-0608', jobTitle: 'Developer' }
  };

  let autoPopulateDataSettings = JSON.parse(localStorage.getItem('autoPopulateData')) || autoPopulateData;

  const updateUserTable = () => {
    userTableBody.innerHTML = '';
    Object.entries(userProfilesSettings).forEach(([key, user]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.userName}</td>
        <td>${user.location}</td>
        <td>${user.email}</td>
        <td>${user.contactNumber}</td>
        <td>${user.jobTitle}</td>
        <td><button class="remove-btn" data-key="${key}">Remove</button></td>
      `;
      userTableBody.appendChild(row);
    });
    localStorage.setItem('userProfiles', JSON.stringify(userProfilesSettings));
  };

  const updateAppTable = () => {
    appTableBody.innerHTML = '';
    Object.entries(autoPopulateDataSettings).forEach(([key, app]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
        <td>${app.priorityCap}</td>
        <td>${app.urgency}</td>
        <td>${app.impact}</td>
        <td>${app.assignmentGroup}</td>
        <td>${app.category}</td>
        <td><button class="remove-btn" data-key="${key}">Remove</button></td>
      `;
      appTableBody.appendChild(row);
    });
    localStorage.setItem('autoPopulateData', JSON.stringify(autoPopulateDataSettings));
  };

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        loginContainer.classList.add('hidden');
        settingsContainer.classList.remove('hidden');
        updateUserTable();
        updateAppTable();
        showToast('Logged in');
      } else {
        showToast('Invalid credentials');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      loginContainer.classList.remove('hidden');
      settingsContainer.classList.add('hidden');
      loginForm.reset();
      showToast('Logged out');
    });
  }

  if (userForm) {
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userName = document.getElementById('user-name-input').value;
      const key = userName.toLowerCase().replace(/\s+/g, '-');
      userProfilesSettings[key] = {
        userName,
        location: document.getElementById('user-location').value,
        email: document.getElementById('user-email').value,
        contactNumber: document.getElementById('user-contact').value,
        jobTitle: document.getElementById('user-job-title').value
      };
      updateUserTable();
      userForm.reset();
      showToast('User added');
    });
  }

  if (appForm) {
    appForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const appName = document.getElementById('app-name').value;
      const key = appName.toLowerCase().replace(/\s+/g, '-');
      autoPopulateDataSettings[key] = {
        priorityCap: document.getElementById('app-priority-cap').value,
        urgency: document.getElementById('app-urgency').value,
        impact: document.getElementById('app-impact').value,
        assignmentGroup: document.getElementById('app-assignment-group').value,
        category: document.getElementById('app-category').value,
        shortDescription: document.getElementById('app-short-description').value,
        businessImpact: document.getElementById('app-business-impact').value
      };
      updateAppTable();
      appForm.reset();
      showToast('App/Service added');
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const key = e.target.dataset.key;
      const table = e.target.closest('table').id;
      if (table === 'user-table-body') {
        delete userProfilesSettings[key];
        updateUserTable();
        showToast('User removed');
      } else if (table === 'app-table-body') {
        delete autoPopulateDataSettings[key];
        updateAppTable();
        showToast('App/Service removed');
      }
    }
  });

  if (settingsContainer && !settingsContainer.classList.contains('hidden')) {
    updateUserTable();
    updateAppTable();
  }

  // Integrations (CodePen)
  const ADMIN_PASSWORD = 'admin123';
  let integrations = JSON.parse(localStorage.getItem('integrations')) || [
    { id: 'INT0001', name: 'PagerDuty', category: 'Incident Management', status: 'Active', lastSync: '2025-06-05 18:00', apiKey: 'pd_abc123' },
    { id: 'INT0002', name: 'Splunk', category: 'Monitoring', status: 'Inactive', lastSync: '2025-06-04 12:30', apiKey: '' }
  ];

  const integrationForm = document.getElementById('integrationForm');
  const integrationsList = document.getElementById('integrations-list');
  const statusFilter = document.getElementById('status-filter');

  function checkAdminPassword(actionCallback) {
    const password = prompt('Enter admin password:');
    if (password === ADMIN_PASSWORD) {
      actionCallback();
    } else {
      showToast('Incorrect password');
    }
  }

  function renderIntegrationsList() {
    if (!integrationsList) {
      console.warn('Integrations list not found');
      return;
    }
    const filterValue = statusFilter ? statusFilter.value : 'all';
    integrationsList.innerHTML = '';
    integrations
      .filter(int => filterValue === 'all' || int.status === filterValue)
      .forEach(int => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <span>${int.name}</span>
          <span>${int.category}</span>
          <span class="status-badge status-${int.status.toLowerCase()}"><span>${int.status}</span></span>
          <span>${int.lastSync}</span>
          <span>
            <button class="cta-btn small secondary" onclick="checkAdminPassword(() => toggleIntegrationStatus('${int.id}'))">${int.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
          </span>
        `;
        integrationsList.appendChild(item);
      });
  }

  window.toggleIntegrationStatus = function(id) {
    const integration = integrations.find(int => int.id === id);
    if (integration) {
      integration.status = integration.status === 'Active' ? 'Inactive' : 'Active';
      integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');
      localStorage.setItem('integrations', JSON.stringify(integrations));
      renderIntegrationsList();
      showToast(`${integration.name} ${integration.status.toLowerCase()}`);
    }
  };

  window.openAddIntegrationModal = function() {
    checkAdminPassword(() => {
      const modal = document.getElementById('add-integration-modal');
      if (modal) modal.style.display = 'flex';
    });
  };

  window.closeAddIntegrationModal = function() {
    const modal = document.getElementById('add-integration-modal');
    if (modal) modal.style.display = 'none';
    if (integrationForm) integrationForm.reset();
  };

  if (integrationForm) {
    integrationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('integration-name').value;
      const apiKey = document.getElementById('api-key').value;
      const newIntegration = {
        id: `INT${String(integrations.length + 1).padStart(4, '0')}`,
        name,
        category: name === 'PagerDuty' ? 'Incident Management' : 'Monitoring',
        status: 'Active',
        lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '),
        apiKey
      };
      integrations.push(newIntegration);
      localStorage.setItem('integrations', JSON.stringify(integrations));
      renderIntegrationsList();
      closeAddIntegrationModal();
      showToast(`${name} added`);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', renderIntegrationsList);
  }

  showPage('dashboard');
});