document.addEventListener('DOMContentLoaded', () => {
  // Global chart instances
  window.charts = {};

  // Page Navigation
  const pages = document.querySelectorAll('.page');
  const menuItems = document.querySelectorAll('.menu-item');
  const dashboardCreateBtn = document.querySelector('.cta-btn[onclick="window.showPage(\'incidents\')"]');
  const sidebarCreateBtn = document.querySelector('.create-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  window.isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

  function showToast(message) {
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 3000);
    }
  }

  window.showPage = function(pageId) {
    console.log(`[NAV] showPage called with pageId: ${pageId}`);
    try {
      pages.forEach(page => {
        page.style.display = page.id === pageId ? 'block' : 'none';
        console.log(`[NAV] Page ${page.id} set to display: ${page.style.display}`);
      });
      menuItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick') || '';
        const isActive = onclickAttr.includes(`showPage('${pageId}')`);
        item.classList.toggle('active', isActive);
        console.log(`[NAV] Menu item '${item.textContent.trim()}' active: ${isActive}`);
      });
      if (pageId === 'dashboard' && window.grid) {
        console.log('[NAV] Refreshing Muuri grid');
        window.grid.refreshItems().layout();
      }
      if (pageId === 'integrations') {
        renderIntegrationsList();
        renderSyncLog();
        updateSyncChart();
      }
      if (pageId === 'alerts') {
        console.log('[INIT] Initializing Alerts page');
        renderAlertsList();
        updateAlertsChart();
      }
      if (pageId === 'workflows') {
        console.log('[INIT] Initializing Workflows page');
        renderWorkflowsList();
        renderWorkflowsLog();
      }
      if (pageId === 'communications') {
        console.log('[INIT] Initializing Communications page');
        renderNotificationHistory();
        renderChatMessages();
        populateChatIncidentSelect();
      }
      if (pageId === 'reports') {
        console.log('[INIT] Initializing Reports page');
        renderReportsHistory();
        updateReportsChart();
      }
      if (pageId === 'settings') {
        console.log('[INIT] Initializing Settings page');
        const loginContainer = document.getElementById('login-container');
        const settingsContainer = document.getElementById('settings-container');
        if (loginContainer && settingsContainer) {
          loginContainer.classList.toggle('hidden', window.isAdminAuthenticated);
          settingsContainer.classList.toggle('hidden', !window.isAdminAuthenticated);
          if (window.isAdminAuthenticated) {
            updateUserTable();
            updateAppTable();
          }
        }
      }
    } catch (error) {
      console.error('[NAV] Error in showPage:', error);
    }
  };

  menuItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const onclickAttr = item.getAttribute('onclick') || '';
      const match = onclickAttr.match(/showPage\('([^']+)'\)/);
      if (match) {
        console.log(`[NAV] Menu item clicked: ${match[1]}`);
        window.showPage(match[1]);
      } else {
        console.warn(`[NAV] No showPage match for menu item: ${item.textContent.trim()}`);
      }
    });
  });

  if (dashboardCreateBtn) {
    dashboardCreateBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[NAV] Dashboard Create New Incident button clicked');
      window.showPage('incidents');
    });
  }

  if (sidebarCreateBtn) {
    sidebarCreateBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[NAV] Sidebar Create Incident button clicked');
      window.showPage('incidents');
    });
  }

  // Sidebar Toggle
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

  // Dashboard Functionality
  window.pageContact = function(name, team) {
    showToast(`Paging ${name} for ${team} team...`);
    console.log(`[Contact] Paging ${name} for ${team}`);
  };

  // Initialize Muuri Grid
  try {
    window.grid = new Muuri('.widget-grid.muuri', {
      dragEnabled: true,
      layout: {
        fillGaps: true,
        horizontal: false,
        alignRight: false,
        alignBottom: false,
        rounding: true
      }
    });
    window.grid.refreshItems().layout();
    console.log('[Muuri] Initialized successfully');
    window.addEventListener('resize', () => {
      window.grid.refreshItems().layout();
      console.log('[Muuri] Grid resized');
    });
  } catch (error) {
    console.error('[Muuri] Initialization failed:', error);
  }

  const addWidgetBtn = document.querySelector('.add-widget-btn');
  if (addWidgetBtn) {
    addWidgetBtn.addEventListener('click', () => {
      try {
        const newWidget = document.createElement('div');
        newWidget.className = 'widget muuri-item uniform';
        newWidget.innerHTML = `
          <div class="muuri-item-content">
            <h3>New Widget</h3>
            <p>Placeholder content</p>
          </div>
        `;
        window.grid.add(newWidget, { index: -1, layout: true });
        console.log('[Muuri] New widget added');
        showToast('New widget added');
      } catch (error) {
        console.error('[Muuri] Failed to add widget:', error);
      }
    });
  }

  // Dashboard Charts
  try {
    const chartsConfig = [
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

    chartsConfig.forEach(chart => {
      const canvas = document.getElementById(chart.id);
      if (canvas) {
        if (window.charts[chart.id]) {
          window.charts[chart.id].destroy();
          console.log(`[Chart] Destroyed existing chart ${chart.id}`);
        }
        window.charts[chart.id] = new Chart(canvas.getContext('2d'), {
          type: chart.type,
          data: chart.data,
          options: chart.options
        });
        console.log(`[Chart] Initialized ${chart.id}`);
      } else {
        console.warn(`[Chart] Canvas #${chart.id} not found`);
      }
    });
  } catch (error) {
    console.error('[Chart] Initialization failed:', error);
  }

  // Incidents (Ticket Form) Functionality
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
  let tickets = JSON.parse(localStorage.getItem('tickets')) || [];

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

  const formatTicketNumber = num => `INC${String(num).padStart(6, '0')}`;

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
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!businessImpactTextarea.value || !impactSelect.value || !urgencySelect.value) {
        showToast('Business Impact, Impact, and Urgency are required');
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
        state: document.getElementById('state').value,
        createdAt: new Date().toISOString()
      };
      tickets.push(formData);
      localStorage.setItem('tickets', JSON.stringify(tickets));
      console.log('Incident Created:', formData);
      showToast(`An incident has been created and sent for review. Ticket Number: ${ticketNumber}`);
      ticketCounter++;
      localStorage.setItem('ticketCounter', ticketCounter);
      form.reset();
      currentTicketNumber = null;
      ticketNumberInput.value = 'Pending';
      if (userProfileSelect) userProfileSelect.dispatchEvent(new Event('change'));
      if (appServiceSelect) appServiceSelect.dispatchEvent(new Event('change'));
    });
  }

  // Alerts Management Functionality
  let alerts = JSON.parse(localStorage.getItem('alerts')) || [
    { id: 'ALERT0001', source: 'PagerDuty', description: 'High CPU Usage', timestamp: '2025-06-10 10:15', status: 'Open' },
    { id: 'ALERT0002', source: 'Splunk', description: 'Network Latency Spike', timestamp: '2025-06-10 09:30', status: 'Acknowledged' },
    { id: 'ALERT0003', source: 'Dynatrace', description: 'Disk Space Low', timestamp: '2025-06-10 08:45', status: 'Open' }
  ];

  function renderAlertsList() {
    const alertsList = document.getElementById('alerts-list');
    if (!alertsList) return;
    const sourceFilter = document.getElementById('alert-source-filter').value;
    const statusFilter = document.getElementById('alert-status-filter').value;
    const timeFilter = document.getElementById('alert-time-filter').value;
    alertsList.innerHTML = '';
    alerts
      .filter(alert => {
        const timestamp = new Date(alert.timestamp);
        const now = new Date();
        const isToday = timestamp.toDateString() === now.toDateString();
        const isWeek = timestamp > new Date(now.setDate(now.getDate() - 7));
        const isMonth = timestamp > new Date(now.setFullYear(now.getFullYear(), now.getMonth() - 1));
        return (
          (sourceFilter === 'all' || alert.source === sourceFilter) &&
          (statusFilter === 'all' || alert.status === statusFilter) &&
          (timeFilter === 'month' || (timeFilter === 'week' && isWeek) || (timeFilter === 'today' && isToday))
        );
      })
      .forEach(alert => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <span>${alert.source}</span>
          <span>${alert.description}</span>
          <span>${alert.timestamp}</span>
          <span><span class="status-badge status-${alert.status.toLowerCase()}">${alert.status}</span></span>
          <span>
            <button class="cta-btn small" onclick="window.acknowledgeAlert('${alert.id}')">Acknowledge</button>
            <button class="cta-btn small secondary" onclick="window.resolveAlert('${alert.id}')">Resolve</button>
            <button class="cta-btn small secondary" onclick="window.linkAlertToIncident('${alert.id}')">Link to Incident</button>
          </span>
        `;
        alertsList.appendChild(item);
      });
  }

  function updateAlertsChart() {
    const canvas = document.getElementById('alertsChart');
    if (!canvas) return;
    if (window.charts.alertsChart) {
      window.charts.alertsChart.destroy();
      console.log('[Chart] Destroyed existing alertsChart');
    }
    const ctx = canvas.getContext('2d');
    window.charts.alertsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM'],
        datasets: [
          { label: 'Alerts', data: [5, 10, 8, 12, 7], borderColor: '#4F46E5', fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
    console.log('[Chart] Initialized alertsChart');
  }

  window.acknowledgeAlert = function(id) {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'Acknowledged';
      alert.timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      localStorage.setItem('alerts', JSON.stringify(alerts));
      renderAlertsList();
      showToast(`Alert ${id} acknowledged`);
    }
  };

  window.resolveAlert = function(id) {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'Resolved';
      alert.timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      localStorage.setItem('alerts', JSON.stringify(alerts));
      renderAlertsList();
      showToast(`Alert ${id} resolved`);
    }
  };

  window.linkAlertToIncident = function(id) {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      window.showPage('incidents');
      if (appServiceSelect) {
        appServiceSelect.value = alert.source.toLowerCase().replace(/\s+/g, '-') || 'helpdesk-portal';
        shortDescriptionInput.value = alert.description.slice(0, 80);
        appServiceSelect.dispatchEvent(new Event('change'));
      }
      showToast(`Creating incident for alert ${id}`);
    }
  };

  const alertSourceFilter = document.getElementById('alert-source-filter');
  const alertStatusFilter = document.getElementById('alert-status-filter');
  const alertTimeFilter = document.getElementById('alert-time-filter');
  if (alertSourceFilter) alertSourceFilter.addEventListener('change', renderAlertsList);
  if (alertStatusFilter) alertStatusFilter.addEventListener('change', renderAlertsList);
  if (alertTimeFilter) alertTimeFilter.addEventListener('change', renderAlertsList);

  // Workflows Functionality
  let workflows = JSON.parse(localStorage.getItem('workflows')) || [
    {
      id: 'WF0001',
      name: 'P1 Incident Notification',
      trigger: 'P1 Incident Created',
      actions: ['Send Email', 'Notify PagerDuty'],
      status: 'Active',
      lastRun: '2025-06-10 10:00'
    }
  ];

  let workflowLog = JSON.parse(localStorage.getItem('workflowLog')) || [
    { id: 'WF0001', timestamp: '2025-06-10 10:00', status: 'Success', message: 'Notified team for P1 incident' }
  ];

  function renderWorkflowsList() {
    const workflowsList = document.getElementById('workflows-list');
    if (!workflowsList) return;
    workflowsList.innerHTML = '';
    workflows.forEach(workflow => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span>${workflow.name}</span>
        <span>${workflow.trigger}</span>
        <span>${workflow.actions.join(', ')}</span>
        <span><span class="status-badge status-${workflow.status.toLowerCase()}">${workflow.status}</span></span>
        <span>${workflow.lastRun || 'Never'}</span>
        <span>
          <button class="cta-btn small" onclick="window.toggleWorkflowStatus('${workflow.id}')">${workflow.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
          <button class="cta-btn small secondary" onclick="window.deleteWorkflow('${workflow.id}')">Delete</button>
        </span>
      `;
      workflowsList.appendChild(item);
    });
  }

  function renderWorkflowsLog() {
    const workflowsLog = document.getElementById('workflows-log');
    if (!workflowsLog) return;
    workflowsLog.innerHTML = '';
    workflowLog.forEach(log => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span>${log.id}</span>
        <span>${log.timestamp}</span>
        <span>${log.status}</span>
        <span>${log.message}</span>
      `;
      workflowsLog.appendChild(item);
    });
  }

  window.openAddWorkflowModal = function() {
    const modal = document.getElementById('add-workflow-modal');
    if (modal) modal.style.display = 'block';
  };

  window.closeAddWorkflowModal = function() {
    const modal = document.getElementById('add-workflow-modal');
    if (modal) modal.style.display = 'none';
  };

  window.toggleWorkflowStatus = function(id) {
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      workflow.status = workflow.status === 'Active' ? 'Inactive' : 'Active';
      workflow.lastRun = new Date().toISOString().slice(0, 16).replace('T', ' ');
      workflowLog.push({
        id,
        timestamp: workflow.lastRun,
        status: 'Success',
        message: `Workflow ${workflow.status}`
      });
      localStorage.setItem('workflows', JSON.stringify(workflows));
      localStorage.setItem('workflowLog', JSON.stringify(workflowLog));
      renderWorkflowsList();
      renderWorkflowsLog();
      showToast(`Workflow ${id} ${workflow.status}`);
    }
  };

  window.deleteWorkflow = function(id) {
    if (!window.isAdminAuthenticated) {
      const password = prompt('Enter admin password to delete workflow');
      if (password !== 'admin123') {
        showToast('Incorrect admin password');
        return;
      }
    }
    workflows = workflows.filter(w => w.id !== id);
    localStorage.setItem('workflows', JSON.stringify(workflows));
    renderWorkflowsList();
    showToast(`Workflow ${id} deleted`);
  };

  const workflowForm = document.getElementById('workflow-form');
  if (workflowForm) {
    workflowForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('workflow-name').value;
      const trigger = document.getElementById('workflow-trigger').value;
      const actions = Array.from(document.getElementById('workflow-actions').selectedOptions).map(opt => opt.value);
      const id = `WF${String(workflows.length + 1).padStart(4, '0')}`;
      workflows.push({
        id,
        name,
        trigger,
        actions,
        status: 'Active',
        lastRun: new Date().toISOString().slice(0, 16).replace('T', ' ')
      });
      workflowLog.push({
        id,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'Success',
        message: `Workflow ${name} created`
      });
      localStorage.setItem('workflows', JSON.stringify(workflows));
      localStorage.setItem('workflowLog', JSON.stringify(workflowLog));
      workflowForm.reset();
      window.closeAddWorkflowModal();
      renderWorkflowsList();
      renderWorkflowsLog();
      showToast(`Workflow ${id} created`);
    });
  }

  // Communications Functionality
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [
    {
      id: 'NOTIF0001',
      subject: 'System Outage Alert',
      message: 'Critical system outage detected. All teams please respond.',
      recipients: 'all',
      priority: 'High',
      timestamp: '2025-06-10 09:00',
      status: 'Sent'
    }
  ];

  let chatMessages = JSON.parse(localStorage.getItem('chatMessages')) || {};

  function renderNotificationHistory() {
    const notificationHistory = document.getElementById('notification-history');
    if (!notificationHistory) return;
    notificationHistory.innerHTML = '';
    notifications.forEach(notif => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span>${notif.timestamp}</span>
        <span>${notif.subject}</span>
        <span>${notif.recipients}</span>
        <span><span class="status-badge status-${notif.status.toLowerCase()}">${notif.status}</span></span>
      `;
      notificationHistory.appendChild(item);
    });
  }

  function populateChatIncidentSelect() {
    const chatIncidentSelect = document.getElementById('chat-incident');
    if (!chatIncidentSelect) return;
    chatIncidentSelect.innerHTML = '<option value="" disabled selected>Select an incident</option>';
    tickets.forEach(ticket => {
      const option = document.createElement('option');
      option.value = ticket.ticketNumber;
      option.textContent = `${ticket.ticketNumber}: ${ticket.shortDescription}`;
      chatIncidentSelect.appendChild(option);
    });
  }

  function renderChatMessages() {
    const chatMessagesDiv = document.getElementById('chat-messages');
    const chatIncidentSelect = document.getElementById('chat-incident');
    if (!chatMessagesDiv || !chatIncidentSelect) return;
    const selectedIncident = chatIncidentSelect.value;
    chatMessagesDiv.innerHTML = '';
    if (selectedIncident && chatMessages[selectedIncident]) {
      chatMessages[selectedIncident].forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `
          <span class="chat-user">${msg.user}</span>
          <span class="chat-timestamp">${msg.timestamp}</span>
          <p>${msg.message}</p>
        `;
        chatMessagesDiv.appendChild(messageDiv);
      });
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
  }

  const notificationForm = document.getElementById('notification-form');
  if (notificationForm) {
    notificationForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!window.isAdminAuthenticated) {
        const password = prompt('Enter admin password to send notification');
        if (password !== 'admin123') {
          showToast('Incorrect admin password');
          return;
        }
      }
      const subject = document.getElementById('notification-subject').value;
      const message = document.getElementById('notification-message').value;
      const recipients = document.getElementById('notification-recipients').value;
      const priority = document.getElementById('notification-priority').value;
      const id = `NOTIF${String(notifications.length + 1).padStart(4, '0')}`;
      notifications.push({
        id,
        subject,
        message,
        recipients,
        priority,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'Sent'
      });
      localStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('Notification Sent:', { id, subject, recipients, status: 'Sent' });
      notificationForm.reset();
      renderNotificationHistory();
      showToast(`Notification ${id} sent`);
    });
  }

  const chatForm = document.getElementById('chat-form');
  const chatIncidentSelect = document.getElementById('chat-incident');
  if (chatForm) {
    chatForm.addEventListener('submit', e => {
      e.preventDefault();
      const incident = chatIncidentSelect.value;
      const message = document.getElementById('chat-message').value;
      if (!incident) {
        showToast('Please select an incident');
        return;
      }
      if (!message) {
        showToast('Please enter a message');
        return;
      }
      if (!chatMessages[incident]) {
        chatMessages[incident] = [];
      }
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      chatMessages[incident].push({
        user: userNameInput && userNameInput.value ? userNameInput.value : 'Anonymous',
        message,
        timestamp
      });
      localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
      chatForm.reset();
      renderChatMessages();
      showToast('Message sent');
    });
  }

  if (chatIncidentSelect) {
    chatIncidentSelect.addEventListener('change', renderChatMessages);
  }

  // Reports Functionality
  let reports = JSON.parse(localStorage.getItem('reports')) || [
    {
      id: 'REPORT0001',
      type: 'Incident Report',
      timeRange: 'Week',
      timestamp: '2025-06-10 08:00',
      data: { open: 15, inProgress: 25, resolved: 10 }
    }
  ];

  function renderReportsHistory() {
    const reportsHistory = document.getElementById('list-reports-history');
    if (!reportsHistory) return;
    reportsHistory.innerHTML = '';
    reports.forEach(report => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span>${report.id}</span>
        <span>${report.type}</span>
        <span>${report.timeRange}</span>
        <span>${report.timestamp}</span>
        <span>
          <button class="cta-btn small" onclick="window.downloadReport('${report.id}')">Download</button>
        </span>
      `;
      reportsHistory.appendChild(item);
    });
  }

  function updateReportsChart() {
    const canvas = document.getElementById('reports-chart');
    if (!canvas) return;
    const reportType = document.getElementById('filter-report-type').value;
    if (window.charts.reportsChart) {
      window.charts.reportsChart.destroy();
      console.log('[Chart] Destroyed existing reportsChart');
    }
    let data;
    if (reportType === 'incident-report') {
      data = {
        labels: ['Open', 'In Progress', 'Resolved'],
        datasets: [{ data: [15, 25, 10], backgroundColor: ['#60A5FA', '#FBBF24', '#22C55E'] }]
      };
    } else if (reportType === 'sla-compliance') {
      data = {
        labels: ['On Track', 'At Risk'],
        datasets: [{ data: [92, 8], backgroundColor: ['#22C55E', '#EF4444'] }]
      };
    } else {
      data = {
        labels: ['Team A', 'Team B', 'Team C'],
        datasets: [{ data: [10, 20, 15], backgroundColor: ['#4F46E5', '#FBBF24', '#60A5FA'] }]
      };
    }
    const ctx = canvas.getContext('2d');
    window.charts.reportsChart = new Chart(ctx, {
      type: reportType === 'incident-report' ? 'pie' : 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: reportType !== 'incident-report' ? { y: { beginAtZero: true } } : {}
      }
    });
    console.log('[Chart] Initialized reportsChart');
  }

  window.generateReport = function() {
    const reportType = document.getElementById('filter-report-type').value;
    const timeRange = document.getElementById('filter-report-time').value;
    const id = `REPORT${String(reports.length + 1).padStart(4, '0')}`;
    const report = {
      id,
      type: reportType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      timeRange,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      data: reportType === 'incident-report' ? { open: 15, inProgress: 25, resolved: 10 } : { sample: 'data' }
    };
    reports.push(report);
    localStorage.setItem('reports', JSON.stringify(reports));
    renderReportsHistory();
    updateReportsChart();
    showToast(`Report ${id} generated`);
  };

  window.downloadReport = function(id) {
    const report = reports.find(r => r.id === id);
    if (!report) return;
    const csvContent = [
      `Report ID,Type,Time Range,Timestamp`,
      `${report.id},${report.type},${report.timeRange},${report.timestamp}`,
      '',
      'Data',
      Object.entries(report.data).map(([key, value]) => `${key},${value}`).join('\n')
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Report ${id} downloaded`);
  };

  const reportTypeSelect = document.getElementById('filter-report-type');
  const reportTimeSelect = document.getElementById('filter-report-time');
  if (reportTypeSelect) reportTypeSelect.addEventListener('change', updateReportsChart);
  if (reportTimeSelect) reportTimeSelect.addEventListener('change', updateReportsChart);

  // Integrations Functionality
  const integrationIcons = {
    PagerDuty: 'fa-bell',
    Nagios: 'fa-exclamation-circle',
    SolarWinds: 'fa-solar-panel',
    Splunk: 'fa-chart-line',
    Dynatrace: 'fa-tachometer-alt',
    AWS: 'fa-cloud',
    ServiceNow: 'fa-cogs',
    Datadog: 'fa-dog',
    Zabbix: 'fa-shield-alt',
    Jira: 'fa-ticket-alt',
    'Custom Webhook': 'fa-link'
  };

  let integrations = JSON.parse(localStorage.getItem('integrations')) || [
    { id: 'INT001', name: 'PagerDuty', category: 'Incident Management', status: 'Active', lastSync: '2025-06-10 08:00', apiKey: 'abc123', endpoint: 'https://api.pagerduty.com', syncInterval: 5 },
    { id: 'INT002', name: 'Splunk', category: 'Monitoring', status: 'Inactive', lastSync: '2025-06-09 12:00', apiKey: 'def456', endpoint: 'https://api.splunk.com', syncInterval: 10 }
  ];

  let syncLog = JSON.parse(localStorage.getItem('syncLog')) || [
    { id: 'INT001', timestamp: '2025-06-10 08:00', status: 'Success', message: 'Synced 10 events' },
    { id: 'INT002', timestamp: '2025-06-09 12:00', status: 'Failed', message: 'Invalid API key' }
  ];

  function renderIntegrationsList() {
    const integrationsList = document.getElementById('integrations-list');
    if (!integrationsList) return;
    const statusFilter = document.getElementById('filter-status').value;
    integrationsList.innerHTML = '';
    integrations
      .filter(integration => statusFilter === 'all' || integration.status === statusFilter)
      .forEach(integration => {
        const iconClass = integrationIcons[integration.name] || 'fa-plug';
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <span><i class="fa ${iconClass} integration-icon"></i>${integration.name}</span>
          <span>${integration.category}</span>
          <span><span class="status-badge status-${integration.status.toLowerCase()}">${integration.status}</span></span>
          <span>${integration.lastSync}</span>
          <span>
            <button class="cta-btn small" onclick="window.toggleIntegrationStatus('${integration.id}')">${integration.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
            <button class="cta-btn small secondary" onclick="window.showIntegrationDetails('${integration.id}')">Details</button>
            <button class="cta-btn small secondary" onclick="window.deleteIntegration('${integration.id}')">Delete</button>
          </span>
        `;
        integrationsList.appendChild(item);
      });
  }

  function renderSyncLog() {
    const syncLogList = document.getElementById('sync-log-list');
    if (!syncLogList) return;
    syncLogList.innerHTML = '';
    syncLog.forEach(log => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span>${log.id}</span>
        <span>${log.timestamp}</span>
        <span>${log.status}</span>
        <span>${log.message}</span>
      `;
      syncLogList.appendChild(item);
    });
  }

  function updateSyncChart() {
    const canvas = document.getElementById('sync-chart');
    if (!canvas) return;
    if (window.charts.syncChart) {
      window.charts.syncChart.destroy();
      console.log('[Chart] Destroyed existing syncChart');
    }
    const ctx = canvas.getContext('2d');
    window.charts.syncChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Success', 'Failed'],
        datasets: [{ data: [25, 5], backgroundColor: ['#22C55E', '#EF4444'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
    console.log('[Chart] Initialized syncChart');
  }

  window.openAddIntegrationModal = function() {
    const modal = document.getElementById('add-integration-modal');
    if (modal) modal.style.display = 'block';
  };

  window.closeAddIntegrationModal = function() {
    const modal = document.getElementById('add-integration-modal');
    if (modal) {
      modal.style.display = 'none';
      document.getElementById('integration-form').reset();
    }
  };

  window.toggleIntegrationStatus = function(id) {
    if (!window.isAdminAuthenticated) {
      const password = prompt('Enter admin password to toggle integration');
      if (password !== 'admin123') {
        showToast('Incorrect admin password');
        return;
      }
    }
    const integration = integrations.find(i => i.id === id);
    if (integration) {
      integration.status = integration.status === 'Active' ? 'Inactive' : 'Active';
      integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');
      syncLog.push({
        id,
        timestamp: integration.lastSync,
        status: integration.status === 'Active' ? 'Success' : 'Deactivated',
        message: `Integration ${integration.name} ${integration.status.toLowerCase()}`
      });
      localStorage.setItem('integrations', JSON.stringify(integrations));
      localStorage.setItem('syncLog', JSON.stringify(syncLog));
      renderIntegrationsList();
      renderSyncLog();
      showToast(`${integration.name} integration ${integration.status}`);
    }
  };

  window.showIntegrationDetails = function(id) {
    const integration = integrations.find(i => i.id === id);
    if (integration) {
      const details = document.getElementById('integration-details');
      if (details) {
        details.style.display = 'block';
        document.getElementById('detail-name').textContent = integration.name;
        document.getElementById('detail-category').value = integration.category;
        document.getElementById('detail-api-key').value = integration.apiKey;
        document.getElementById('detail-endpoint').value = integration.endpoint;
        document.getElementById('detail-sync').value = integration.syncInterval;
        document.getElementById('detail-id').value = id;
      }
    }
  };

  window.editIntegrationDetails = function() {
    const inputs = document.querySelectorAll('#integration-details input:not(#detail-id)');
    inputs.forEach(input => input.removeAttribute('disabled'));
    document.querySelector('#integration-details button[aria-label="Edit integration details"]').style.display = 'none';
    document.querySelector('#integration-details button[aria-label="Save integration details"]').style.display = 'inline-block';
  };

  window.saveIntegrationDetails = function() {
    if (!window.isAdminAuthenticated) {
      const password = prompt('Enter admin password to save integration');
      if (password !== 'admin123') {
        showToast('Incorrect admin password');
        return;
      }
    }
    const id = document.getElementById('detail-id').value;
    const integration = integrations.find(i => i.id === id);
    if (integration) {
      integration.category = document.getElementById('detail-category').value;
      integration.apiKey = document.getElementById('detail-api-key').value;
      integration.endpoint = document.getElementById('detail-endpoint').value;
      integration.syncInterval = parseInt(document.getElementById('detail-sync').value);
      integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');
      syncLog.push({
        id,
        timestamp: integration.lastSync,
        status: 'Success',
        message: `Integration ${integration.name} updated`
      });
      localStorage.setItem('integrations', JSON.stringify(integrations));
      localStorage.setItem('syncLog', JSON.stringify(syncLog));
      const inputs = document.querySelectorAll('#integration-details input:not(#detail-id)');
      inputs.forEach(input => input.setAttribute('disabled', 'true'));
      document.querySelector('#integration-details button[aria-label="Edit integration details"]').style.display = 'inline-block';
      document.querySelector('#integration-details button[aria-label="Save integration details"]').style.display = 'none';
      renderIntegrationsList();
      renderSyncLog();
      showToast(`${integration.name} integration updated`);
    }
  };

  window.closeIntegrationDetails = function() {
    const details = document.getElementById('integration-details');
    if (details) {
      details.style.display = 'none';
      const inputs = document.querySelectorAll('#integration-details input:not(#detail-id)');
      inputs.forEach(input => {
        input.setAttribute('disabled', 'true');
        input.value = '';
      });
      document.getElementById('detail-name').textContent = '';
      document.getElementById('detail-id').value = '';
    }
  };

  window.deleteIntegration = function(id) {
    if (!window.isAdminAuthenticated) {
      const password = prompt('Enter admin password to delete integration');
      if (password !== 'admin123') {
        showToast('Incorrect admin password');
        return;
      }
    }
    integrations = integrations.filter(i => i.id !== id);
    localStorage.setItem('integrations', JSON.stringify(integrations));
    renderIntegrationsList();
    renderSyncLog();
    showToast('Integration deleted');
  };

  const integrationForm = document.getElementById('integration-form');
  if (integrationForm) {
    integrationForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!window.isAdminAuthenticated) {
        const password = prompt('Enter admin password to add integration');
        if (password !== 'admin123') {
          showToast('Invalid admin password');
          return;
        }
      }
      const name = document.getElementById('integration-name').value;
      const id = `INT${String(integrations.length + 1).padStart(3, '0')}`;
      const integration = {
        id,
        name,
        category: name === 'Custom Webhook' ? 'Webhook' : name === 'PagerDuty' || name === 'ServiceNow' || name === 'Jira' ? 'Incident Management' : 'Monitoring',
        status: 'Active',
        lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '),
        apiKey: document.getElementById('api-key').value,
        endpoint: document.getElementById('endpoint').value,
        syncInterval: parseInt(document.getElementById('sync-interval').value)
      };
      integrations.push(integration);
      syncLog.push({
        id,
        timestamp: integration.lastSync,
        status: 'Success',
        message: `Integration ${name} added`
      });
      localStorage.setItem('integrations', JSON.stringify(integrations));
      localStorage.setItem('syncLog', JSON.stringify(syncLog));
      integrationForm.reset();
      window.closeAddIntegrationModal();
      renderIntegrationsList();
      renderSyncLog();
      showToast('Integration added');
    });
  }

  const statusFilter = document.getElementById('filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', renderIntegrationsList);
  }

  // Settings Functionality
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const userForm = document.getElementById('user-form');
  const appForm = document.getElementById('app-form');

  let users = JSON.parse(localStorage.getItem('users')) || [
    { id: 'USR001', name: 'Alice Johnson', email: 'alice.johnson@tech.com', contact: '212-555-0101', jobTitle: 'Network Engineer' },
    { id: 'USR002', name: 'Bob Smith', email: 'bob.smith@tech.com', contact: '312-555-0202', jobTitle: 'Server Admin' }
  ];

  let applications = JSON.parse(localStorage.getItem('applications')) || [
    {
      id: 'APP001',
      name: 'Citrix Storefront',
      priorityCap: 'P1 High',
      urgency: 'High',
      impact: 'High',
      assignmentGroup: 'Citrix Team',
      category: 'Application',
      shortDescription: 'Virtual Desktop Access',
      businessImpact: 'Critical for remote work'
    }
  ];

  function updateUserTable() {
    const userTableBody = document.querySelector('#users-table tbody');
    if (!userTableBody) return;
    userTableBody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.contact}</td>
        <td>${user.jobTitle}</td>
        <td><button class="cta-btn cta-btn small secondary" onclick="window.removeUser('${user.id}')">Delete</button></td>
      `;
      userTableBody.appendChild(row);
    });
  }

  function updateAppTable() {
    const appTableBody = document.querySelector('#apps-table tbody');
    if (!appTableBody) return;
    appTableBody.innerHTML = '';
    applications.forEach(app => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${app.id}</td>
        <td>${app.name}</td>
        <td>${app.priorityCap}</td>
        <td>${app.urgency}</td>
        <td>${app.impact}</td>
        <td>${app.assignmentGroup}</td>
        <td>${app.category}</td>
        <td><button class="cta-btn cta-btn small secondary" onclick="window.removeApp('${app.id}')">Delete</button></td>
      `;
      appTableBody.appendChild(row);
    });
  };

  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      if (username === 'admin' && password === 'admin123') {
        window.isAdminAuthenticated = true;
        localStorage.setItem('isAdminAuthenticated', 'true');
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('settings-container').classList.remove('hidden');
        updateUserTable();
        updateAppTable();
        showToast('Successfully logged in');
      } else {
        showToast('Invalid credentials');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.isAdminAuthenticated = false;
      localStorage.removeItem('isAdminAuthenticated');
      document.getElementById('login-container').classList.remove('hidden');
      document.getElementById('settings-container').classList.add('hidden');
      showToast('Successfully logged out');
    });
  }

  window.removeUser = function(id) {
    if (!window.isAdminAuthenticated) {
      const password = prompt('Enter admin password to remove user');
      if (password !== 'admin123') {
        showToast('Incorrect admin password');
        return;
      }
    }
    users = users.filter(user => user.id !== id);
    localStorage.setItem('users', JSON.stringify(users));
    updateUserTable();
    showToast('User deleted');
  };

  window.removeApp = function(id) {
    if (!window.isAdminAuthenticated) {
      const password = prompt('Enter admin password to remove application');
      if (password !== 'admin123') {
        showToast('Incorrect admin password');
        return;
      }
    }
    applications = applications.filter(app => app.id !== id);
    localStorage.setItem('applications', JSON.stringify(applications));
    showToast('Application deleted');
    updateAppTable();
  };

  if (userForm) {
    userForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!window.isAdminAuthenticated) {
        const password = prompt('Enter admin password to add user');
        if (password !== 'admin123') {
          showToast('Incorrect admin password');
          return;
        }
      }
      const user = {
        id: `USR${String(users.length + 1).padStart(3, '0')}`,
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        contact: document.getElementById('user-contact').value,
        jobTitle: document.getElementById('user-job-title').value
      };
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
      userForm.reset();
      updateUserTable();
      showToast('User added successfully');
    });
  }

  if (appForm) {
    appForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!window.isAdminAuthenticated) {
        const password = prompt('Enter admin password to add application');
        if (password !== 'admin123') {
          showToast('Incorrect admin password');
          return;
        }
      }
      const app = {
        id: `APP${String(applications.length + 1).padStart(3, '0')}`,
        name: document.getElementById('app-name').value,
        priorityCap: document.getElementById('app-priority').value,
        urgency: document.getElementById('app-urgency').value,
        impact: document.getElementById('app-impact').value,
        assignmentGroup: document.getElementById('app-assignment-group').value,
        category: document.getElementById('app-category').value,
        shortDescription: document.getElementById('app-short-description').value,
        businessImpact: document.getElementById('app-business-impact').value
      };
      applications.push(app);
      localStorage.setItem('applications', JSON.stringify(applications));
      appForm.reset();
      updateAppTable();
      showToast('Application added successfully');
    });
  }

  // Initial Page Load
  window.showPage('dashboard');
});