// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  // Global state
  window.charts = {};
  window.isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

  // DOM elements
  const pages = document.querySelectorAll('.page');
  const menuItems = document.querySelectorAll('.menu-item');
  const dashboardCreateBtn = document.querySelector('.cta-btn[onclick="window.showPage(\'incidents\')"]');
  const sidebarCreateBtn = document.querySelector('.create-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // Utility Functions
  function showToast(message) {
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 3000);
    } else {
      console.warn('[Toast] Toast elements not found');
    }
  }

  function safeParse(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`[localStorage] Failed to parse ${key}:`, error);
      return defaultValue;
    }
  }

  // Navigation
  window.showPage = function(pageId) {
    console.log(`[NAV] showPage called with pageId: ${pageId}`);
    try {
      if (!pages.length) throw new Error('No pages found in DOM');
      pages.forEach(page => {
        const isVisible = page.id === pageId;
        page.style.display = isVisible ? 'block' : 'none';
        console.log(`[NAV] Page ${page.id} set to display: ${page.style.display}`);
      });
      menuItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick') || '';
        const isActive = onclickAttr.includes(`showPage('${pageId}')`);
        item.classList.toggle('active', isActive);
        console.log(`[NAV] Menu item '${item.textContent.trim()}' active: ${isActive}`);
      });
      // Page-specific initialization
      if (pageId === 'dashboard' && window.grid) {
        window.grid.refreshItems().layout();
        console.log('[NAV] Refreshed Dashboard grid');
      }
      if (pageId === 'monitoring' && window.monitoringGrid) {
        window.monitoringGrid.refreshItems().layout();
        populateMonitoringList();
      }
      if (pageId === 'workflows' && window.workflowsGrid) {
        window.workflowsGrid.refreshItems().layout();
        populateWorkflowsList();
      }
      if (pageId === 'communications' && window.communicationsGrid) {
        window.communicationsGrid.refreshItems().layout();
        populateCommunicationsList();
        populateChatMessages();
        updateTemplateTable();
      }
      if (pageId === 'reports' && window.reportsGrid) {
        window.reportsGrid.refreshItems().layout();
        populateReportsList();
      }
      if (pageId === 'integrations') {
        renderIntegrationsList();
        renderSyncLog();
        updateSyncChart();
      }
      if (pageId === 'settings') {
        const loginContainer = document.getElementById('login-container');
        const settingsContainer = document.getElementById('settings-container');
        if (loginContainer && settingsContainer) {
          loginContainer.classList.toggle('hidden', window.isAdminAuthenticated);
          settingsContainer.classList.toggle('hidden', !window.isAdminAuthenticated);
          if (window.isAdminAuthenticated) {
            updateUserTable();
            updateAppTable();
          }
        } else {
          console.warn('[Settings] Login or settings container not found');
        }
      }
    } catch (error) {
      console.error(`[NAV] Error in showPage for ${pageId}:`, error);
    }
  };

  // Menu item click handlers
  menuItems.forEach(item => {
    item.removeEventListener('click', handleMenuClick); // Prevent duplicate listeners
    item.addEventListener('click', handleMenuClick);
  });

  function handleMenuClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const onclickAttr = e.currentTarget.getAttribute('onclick') || '';
    const match = onclickAttr.match(/showPage\('([^']+)'\)/);
    if (match) {
      console.log(`[NAV] Menu item clicked: ${match[1]}`);
      window.showPage(match[1]);
    } else {
      console.warn(`[NAV] No showPage match for menu item: ${e.currentTarget.textContent.trim()}`);
    }
  }

  // Create Incident buttons
  if (dashboardCreateBtn) {
    dashboardCreateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[NAV] Dashboard Create New Incident button clicked');
      window.showPage('incidents');
    });
  }

  if (sidebarCreateBtn) {
    sidebarCreateBtn.addEventListener('click', (e) => {
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
      ['grid', 'monitoringGrid', 'workflowsGrid', 'communicationsGrid', 'reportsGrid'].forEach(grid => {
        if (window[grid]) window[grid].refreshItems().layout();
      });
      console.log('[Muuri] Grids refreshed on sidebar toggle');
    });
  }

  // Dashboard Functionality
  window.pageContact = function(name, team) {
    showToast(`Paging ${name} for ${team} team...`);
  };

  // Initialize Muuri Grids
  try {
    if (typeof Muuri === 'undefined') throw new Error('Muuri library not loaded');
    const grids = [
      { selector: '.widget-grid.muuri', name: 'Dashboard', variable: 'grid' },
      { selector: '.monitoring-grid.muuri', name: 'Monitoring', variable: 'monitoringGrid' },
      { selector: '.workflows-grid.muuri', name: 'Workflows', variable: 'workflowsGrid' },
      { selector: '.communications-grid.muuri', name: 'Communications', variable: 'communicationsGrid' },
      { selector: '.reports-grid.muuri', name: 'Reports', variable: 'reportsGrid' }
    ];
    grids.forEach(({ selector, name, variable }) => {
      const gridElement = document.querySelector(selector);
      if (gridElement) {
        window[variable] = new Muuri(selector, {
          dragEnabled: true,
          layout: { fillGaps: false, horizontal: false, alignRight: false, alignBottom: false, rounding: false }
        });
        window[variable].refreshItems().layout();
        console.log(`[Muuri] Initialized ${name} grid`);
      } else {
        console.warn(`[Muuri] ${name} grid container not found`);
      }
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        grids.forEach(({ variable }) => {
          if (window[variable]) window[variable].refreshItems().layout();
        });
        console.log('[Muuri] Grids resized');
      }, 100);
    });
  } catch (error) {
    console.error('[Muuri] Grid initialization failed:', error);
  }

  // Add Widget Button
  const addWidgetBtn = document.querySelector('.add-widget-btn');
  if (addWidgetBtn) {
    addWidgetBtn.addEventListener('click', () => {
      try {
        if (!window.grid) throw new Error('Dashboard grid not initialized');
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
    },
    {
      id: 'monitoring-chart',
      type: 'line',
      data: {
        labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM'],
        datasets: [{ label: 'System Load', data: [20, 30, 25, 40, 35], borderColor: '#4F46E5', fill: false }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    },
    {
      id: 'workflows-chart',
      type: 'bar',
      data: {
        labels: ['Active', 'Pending', 'Completed'],
        datasets: [{ label: 'Workflows', data: [10, 5, 15], backgroundColor: '#60A5FA' }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    },
    {
      id: 'communications-chart',
      type: 'pie',
      data: {
        labels: ['Sent', 'Pending'],
        datasets: [{ data: [50, 20], backgroundColor: ['#22C55E', '#FBBF24'], borderWidth: 1 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    },
    {
      id: 'reports-chart',
      type: 'doughnut',
      data: {
        labels: ['Generated', 'In Progress'],
        datasets: [{ data: [30, 10], backgroundColor: ['#4F46E5', '#EF4444'], borderWidth: 1 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    }
  ];

  try {
    if (typeof Chart === 'undefined') throw new Error('Chart.js library not loaded');
    chartsConfig.forEach(chart => {
      const canvas = document.getElementById(chart.id);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (window.charts[chart.id]) {
            window.charts[chart.id].destroy();
            console.log(`[Chart] Destroyed existing chart ${chart.id}`);
          }
          window.charts[chart.id] = new Chart(ctx, {
            type: chart.type,
            data: chart.data,
            options: chart.options
          });
          console.log(`[Chart] Initialized ${chart.id}`);
        } else {
          console.warn(`[Chart] Canvas context for #${chart.id} not available`);
        }
      } else {
        console.warn(`[Chart] Canvas #${chart.id} not found`);
      }
    });
  } catch (error) {
    console.error('[Chart] Initialization failed:', error);
  }

  // List Population Functions
  function populateMonitoringList(filter = 'all') {
    const list = document.getElementById('monitoring-alerts-list');
    if (!list) return;
    const alerts = [
      { text: 'High CPU Usage - 10:15 AM', type: 'critical' },
      { text: 'Network Latency - 9:30 AM', type: 'warning' },
      { text: 'Disk Space Low - 8:45 AM', type: 'warning' }
    ];
    list.innerHTML = '';
    alerts
      .filter(alert => filter === 'all' || alert.type === filter)
      .forEach(alert => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = alert.text;
        list.appendChild(item);
      });
  }

  function populateWorkflowsList(filter = 'all') {
    const list = document.getElementById('workflows-list');
    if (!list) return;
    const workflows = [
      { text: 'Incident Review - In Progress', status: 'active' },
      { text: 'Server Upgrade - Pending', status: 'pending' },
      { text: 'Backup Workflow - Active', status: 'active' }
    ];
    list.innerHTML = '';
    workflows
      .filter(workflow => filter === 'all' || workflow.status === filter)
      .forEach(workflow => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = workflow.text;
        list.appendChild(item);
      });
  }

  function populateCommunicationsList(filter = 'all') {
    const list = document.getElementById('communications-list');
    if (!list) return;
    const communications = [
      { text: 'Team Update - Sent', status: 'active' },
      { text: 'Incident Alert - Pending', status: 'pending' },
      { text: 'Maintenance Notice - Active', status: 'active' }
    ];
    list.innerHTML = '';
    communications
      .filter(comm => filter === 'all' || comm.status === filter)
      .forEach(comm => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = comm.text;
        list.appendChild(item);
      });
  }

  function populateReportsList(filter = 'all') {
    const list = document.getElementById('reports-list');
    if (!list) return;
    const reports = [
      { text: 'Monthly Incident Report - Generated', status: 'active' },
      { text: 'SLA Compliance - Pending', status: 'pending' },
      { text: 'Team Performance - Active', status: 'active' }
    ];
    list.innerHTML = '';
    reports
      .filter(report => filter === 'all' || report.status === filter)
      .forEach(report => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = report.text;
        list.appendChild(item);
      });
  }

  // Filter Handlers
  const monitoringFilter = document.getElementById('monitoring-filter');
  if (monitoringFilter) {
    monitoringFilter.addEventListener('change', () => {
      populateMonitoringList(monitoringFilter.value);
      console.log(`[FILTER] Monitoring filter changed to: ${monitoringFilter.value}`);
    });
    populateMonitoringList();
  }

  const workflowsFilter = document.getElementById('workflows-filter');
  if (workflowsFilter) {
    workflowsFilter.addEventListener('change', () => {
      populateWorkflowsList(workflowsFilter.value);
      console.log(`[FILTER] Workflows filter changed to: ${workflowsFilter.value}`);
    });
    populateWorkflowsList();
  }

  const communicationsFilter = document.getElementById('communications-filter');
  if (communicationsFilter) {
    communicationsFilter.addEventListener('change', () => {
      populateCommunicationsList(communicationsFilter.value);
      console.log(`[FILTER] Communications filter changed to: ${communicationsFilter.value}`);
    });
    populateCommunicationsList();
  }

  const reportsFilter = document.getElementById('reports-filter');
  if (reportsFilter) {
    reportsFilter.addEventListener('change', () => {
      populateReportsList(reportsFilter.value);
      console.log(`[FILTER] Reports filter changed to: ${reportsFilter.value}`);
    });
    populateReportsList();
  }

  // Incident Form Handling
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

  let ticketCounter = parseInt(safeParse('ticketCounter', 0));
  let currentTicketNumber = null;
  let tickets = safeParse('tickets', []);

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

  function updatePriority() {
    const selectedApp = appServiceSelect?.value || '';
    const selectedImpact = impactSelect?.value || '';
    const selectedUrgency = urgencySelect?.value || '';
    const data = autoPopulateData[selectedApp] || {};
    const priorityCap = data.priorityCap || 'P4 Low';
    const key = `${selectedImpact}-${selectedUrgency}`;
    let priority = priorityMatrix[key] || 'P4 Low';
    if (priorityRank[priority] < priorityRank[priorityCap]) {
      priority = priorityCap;
    }
    if (priorityInput) priorityInput.value = priority;
  }

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
      const requiredFields = [
        { element: userProfileSelect, name: 'User Profile' },
        { element: appServiceSelect, name: 'Application/Service' },
        { element: businessImpactTextarea, name: 'Business Impact' },
        { element: impactSelect, name: 'Impact' },
        { element: urgencySelect, name: 'Urgency' }
      ];
      for (const { element, name } of requiredFields) {
        if (!element?.value) {
          showToast(`${name} is required`);
          return;
        }
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
        additionalComments: document.getElementById('additional-comments')?.value || '',
        businessImpact: businessImpactTextarea.value,
        workNotes: document.getElementById('work-notes')?.value || '',
        state: document.getElementById('state')?.value || '',
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

  // Integrations Handling
  const ADMIN_PASSWORD = 'admin123';
  const integrationIcons = {
    'PagerDuty': 'fa-bell',
    'Nagios': 'fa-exclamation-circle',
    'SolarWinds': 'fa-sun',
    'Splunk': 'fa-chart-line',
    'Dynatrace': 'fa-tachometer-alt',
    'AWS': 'fa-aws',
    'ServiceNow': 'fa-cogs',
    'Datadog': 'fa-dog',
    'Zabbix': 'fa-eye',
    'Jira': 'fa-ticket-alt',
    'Custom Webhook': 'fa-plug'
  };

  let integrations = safeParse('integrations', [
    {
      id: 'INT0001',
      name: 'PagerDuty',
      category: 'Incident Management',
      status: 'Active',
      lastSync: '2025-06-05 18:00',
      apiKey: 'pd_abc123',
      endpoint: 'https://api.pagerduty.com',
      syncInterval: 5,
      eventsSynced: 120
    },
    {
      id: 'INT0002',
      name: 'Splunk',
      category: 'Monitoring',
      status: 'Inactive',
      lastSync: '2025-06-04 12:30',
      apiKey: '',
      endpoint: '',
      syncInterval: 10,
      eventsSynced: 0
    }
  ]);

  let syncLog = safeParse('syncLog', [
    { id: 'INT0001', timestamp: '2025-06-05 18:00', status: 'Success', message: 'Synced 120 events from PagerDuty' },
    { id: 'INT0002', timestamp: '2025-06-04 12:30', status: 'Failed', message: 'Splunk sync failed: Invalid API key' }
  ]);

  const integrationForm = document.getElementById('integrationForm');
  const integrationsList = document.getElementById('integrations-list');
  const statusFilter = document.getElementById('status-filter');
  const integrationDetails = document.getElementById('integration-details');
  const syncLogList = document.getElementById('sync-log-list');
  let selectedIntegration = null;

  function checkAdminPassword(actionCallback) {
    if (window.isAdminAuthenticated) {
      actionCallback();
    } else {
      const password = prompt('Enter admin password:');
      if (password === ADMIN_PASSWORD) {
        actionCallback();
      } else {
        showToast('Incorrect admin password');
      }
    }
  }

  function renderIntegrationsList() {
    if (!integrationsList) return;
    const filterValue = statusFilter ? statusFilter.value : 'all';
    integrationsList.innerHTML = '';
    integrations
      .filter(integration => filterValue === 'all' || integration.status === filterValue)
      .forEach(integration => {
        const item = document.createElement('div');
        item.className = `list-item ${selectedIntegration && selectedIntegration.id === integration.id ? 'active' : ''}`;
        item.innerHTML = `
          <span><i class="fa ${integrationIcons[integration.name] || 'fa-cog'} integration-icon" aria-hidden="true"></i> ${integration.name}</span>
          <span>${integration.category}</span>
          <span><span class="status-badge status-${integration.status.toLowerCase()}">${integration.status}</span></span>
          <span>${integration.lastSync}</span>
          <span>
            <button class="cta-btn small" onclick="window.viewIntegrationDetails('${integration.id}')">View</button>
            <button class="cta-btn small secondary" onclick="window.checkAdminPassword(() => window.toggleIntegrationStatus('${integration.id}'))">${integration.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
            <button class="cta-btn small secondary" onclick="window.checkAdminPassword(() => window.deleteIntegration('${integration.id}'))">Delete</button>
          </span>
        `;
        integrationsList.appendChild(item);
      });
  }

  function renderSyncLog() {
    if (!syncLogList) return;
    syncLogList.innerHTML = '';
    syncLog.slice(0, 10).forEach(log => {
      const logItem = document.createElement('div');
      logItem.className = 'log-item';
      const integration = integrations.find(int => int.id === log.id);
      logItem.innerHTML = `[${log.timestamp}] ${integration ? integration.name : 'Unknown'}: ${log.status} - ${log.message}`;
      syncLogList.appendChild(logItem);
    });
  }

  function updateSyncChart() {
    const canvas = document.getElementById('syncChart');
    if (!canvas) return;
    if (window.charts.syncChart) {
      window.charts.syncChart.destroy();
      console.log('[Chart] Destroyed existing syncChart');
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      window.charts.syncChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: integrations.map(int => int.name),
          datasets: [{
            label: 'Events Synced',
            data: integrations.map(int => int.eventsSynced || 0),
            backgroundColor: '#4F46E5'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } }
        }
      });
      console.log('[Chart] Initialized syncChart');
    }
  }

  window.viewIntegrationDetails = function(id) {
    selectedIntegration = integrations.find(int => int.id === id);
    if (!selectedIntegration || !integrationDetails) return;
    integrationDetails.style.display = 'block';
    document.getElementById('detail-name').textContent = selectedIntegration.name;
    document.getElementById('detail-category').textContent = selectedIntegration.category;
    document.getElementById('detail-api-key').value = selectedIntegration.apiKey || '';
    document.getElementById('detail-endpoint').value = selectedIntegration.endpoint || '';
    document.getElementById('detail-sync-interval').value = selectedIntegration.syncInterval || '';
    document.querySelector('button[onclick="window.saveIntegrationDetails()"]').style.display = 'none';
  };

  window.editIntegrationDetails = function() {
    checkAdminPassword(() => {
      if (!selectedIntegration) return;
      document.getElementById('detail-api-key').removeAttribute('readonly');
      document.getElementById('detail-endpoint').removeAttribute('readonly');
      document.getElementById('detail-sync-interval').removeAttribute('readonly');
      document.querySelector('button[onclick="window.editIntegrationDetails()"]').style.display = 'none';
      document.querySelector('button[onclick="window.saveIntegrationDetails()"]').style.display = 'inline-block';
    });
  };

  window.saveIntegrationDetails = function() {
    if (!selectedIntegration) return;
    selectedIntegration.apiKey = document.getElementById('detail-api-key').value;
    selectedIntegration.endpoint = document.getElementById('detail-endpoint').value;
    selectedIntegration.syncInterval = parseInt(document.getElementById('detail-sync-interval').value);
    document.getElementById('detail-api-key').setAttribute('readonly', true);
    document.getElementById('detail-endpoint').setAttribute('readonly', true);
    document.getElementById('detail-sync-interval').setAttribute('readonly', true);
    document.querySelector('button[onclick="window.editIntegrationDetails()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="window.saveIntegrationDetails()"]').style.display = 'none';
    localStorage.setItem('integrations', JSON.stringify(integrations));
    showToast('Integration details saved');
    renderIntegrationsList();
  };

  window.closeIntegrationDetails = function() {
    if (integrationDetails) integrationDetails.style.display = 'none';
    selectedIntegration = null;
    renderIntegrationsList();
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

  window.toggleIntegrationStatus = function(id) {
    const integration = integrations.find(int => int.id === id);
    if (integration) {
      integration.status = integration.status === 'Active' ? 'Inactive' : 'Active';
      integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');
      integration.eventsSynced = integration.status === 'Active' ? (integration.eventsSynced || 0) + 50 : integration.eventsSynced;
      syncLog.unshift({
        id: integration.id,
        timestamp: integration.lastSync,
        status: integration.status === 'Active' ? 'Success' : 'Info',
        message: `${integration.name} ${integration.status === 'Active' ? 'activated' : 'deactivated'}`
      });
      localStorage.setItem('integrations', JSON.stringify(integrations));
      localStorage.setItem('syncLog', JSON.stringify(syncLog));
      renderIntegrationsList();
      renderSyncLog();
      updateSyncChart();
      showToast(`${integration.name} ${integration.status === 'Active' ? 'activated' : 'deactivated'}`);
    }
  };

  window.deleteIntegration = function(id) {
    integrations = integrations.filter(int => int.id !== id);
    syncLog = syncLog.filter(log => log.id !== id);
    localStorage.setItem('integrations', JSON.stringify(integrations));
    localStorage.setItem('syncLog', JSON.stringify(syncLog));
    renderIntegrationsList();
    renderSyncLog();
    updateSyncChart();
    if (selectedIntegration && selectedIntegration.id === id) {
      window.closeIntegrationDetails();
    }
    showToast('Integration deleted');
  };

  if (integrationForm) {
    integrationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkAdminPassword(() => {
        const name = document.getElementById('integration-name').value;
        const apiKey = document.getElementById('api-key').value;
        const endpoint = document.getElementById('endpoint').value;
        const syncInterval = parseInt(document.getElementById('sync-interval').value);
        const newIntegration = {
          id: `INT${String(integrations.length + 1).padStart(4, '0')}`,
          name,
          category: {
            'PagerDuty': 'Incident Management',
            'Nagios': 'Monitoring',
            'SolarWinds': 'Monitoring',
            'Splunk': 'Monitoring',
            'Dynatrace': 'Monitoring',
            'AWS': 'Cloud',
            'ServiceNow': 'ITSM',
            'Datadog': 'Monitoring',
            'Zabbix': 'Monitoring',
            'Jira': 'Project Management',
            'Custom Webhook': 'Custom'
          }[name] || 'Other',
          status: 'Active',
          lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '),
          apiKey,
          endpoint,
          syncInterval,
          eventsSynced: 0
        };
        integrations.push(newIntegration);
        syncLog.unshift({
          id: newIntegration.id,
          timestamp: newIntegration.lastSync,
          status: 'Success',
          message: `Added new integration: ${name}`
        });
        localStorage.setItem('integrations', JSON.stringify(integrations));
        localStorage.setItem('syncLog', JSON.stringify(syncLog));
        renderIntegrationsList();
        renderSyncLog();
        updateSyncChart();
        window.closeAddIntegrationModal();
        showToast(`Integration ${name} added`);
      });
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', renderIntegrationsList);
  }

  // Settings Handling
  const loginContainer = document.getElementById('login-container');
  const settingsContainer = document.getElementById('settings-container');
  const loginForm = document.getElementById('login-form');
  const userForm = document.getElementById('user-form');
  const appForm = document.getElementById('app-form');
  const userTableBody = document.getElementById('user-table-body');
  const appTableBody = document.getElementById('app-table-body');
  const logoutBtn = document.getElementById('logout-btn');

  const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

  let userProfilesSettings = safeParse('userProfiles', {
    'alice-johnson': { userName: 'Alice Johnson', location: 'New York, NY', email: 'alice.johnson@example.com', contactNumber: '212-555-0101', jobTitle: 'Manager' },
    'bob-smith': { userName: 'Bob Smith', location: 'Chicago, IL', email: 'bob.smith@example.com', contactNumber: '312-555-0202', jobTitle: 'Technician' },
    'clara-lee': { userName: 'Clara Lee', location: 'San Francisco, CA', email: 'clara.lee@example.com', contactNumber: '415-555-0303', jobTitle: 'Analyst' },
    'david-brown': { userName: 'David Brown', location: 'Austin, TX', email: 'david.brown@example.com', contactNumber: '512-555-0404', jobTitle: 'Engineer' },
    'Jack-Berry': { userName: 'Jack Berry', location: 'Sandy, UT', email: 'jack.berry@example.com', contactNumber: '801-803-0608', jobTitle: 'Developer' }
  });

  let autoPopulateDataSettings = safeParse('autoPopulateData', autoPopulateData);

  function updateUserTable() {
    if (!userTableBody) return;
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
  }

  function updateAppTable() {
    if (!appTableBody) return;
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
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        window.isAdminAuthenticated = true;
        localStorage.setItem('isAdminAuthenticated', 'true');
        loginContainer.classList.add('hidden');
        settingsContainer.classList.remove('hidden');
        updateUserTable();
        updateAppTable();
        showToast('Logged in successfully');
      } else {
        showToast('Invalid credentials');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.isAdminAuthenticated = false;
      localStorage.removeItem('isAdminAuthenticated');
      loginContainer.classList.remove('hidden');
      settingsContainer.classList.add('hidden');
      loginForm.reset();
      showToast('Logged out');
    });
  }

  if (userForm) {
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkAdminPassword(() => {
        const userName = document.getElementById('user-name-input').value.trim();
        const key = userName.toLowerCase().replace(/\s+/g, '-');
        userProfilesSettings[key] = {
          userName,
          location: document.getElementById('user-location').value.trim(),
          email: document.getElementById('user-email').value.trim(),
          contactNumber: document.getElementById('user-contact-number').value.trim(),
          jobTitle: document.getElementById('user-job-title').value.trim()
        };
        updateUserTable();
        userForm.reset();
        showToast('User added successfully');
      });
    });
  }

  if (appForm) {
    appForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkAdminPassword(() => {
        const appName = document.getElementById('app-name').value.trim();
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
        showToast('Application added successfully');
      });
    });
  }

  // Handle Remove Buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      e.preventDefault();
      checkAdminPassword(() => {
        const key = e.target.dataset.key;
        const table = e.target.closest('tbody').id;
        if (table === 'user-table-body') {
          delete userProfilesSettings[key];
          updateUserTable();
          showToast('User removed successfully');
        } else if (table === 'app-table-body') {
          delete autoPopulateDataSettings[key];
          updateAppTable();
          showToast('Application removed successfully');
        }
      });
    }
  });

  // Communications Handling
  let messages = safeParse('chatMessages', { general: [], 'incident-p1': [], 'incident-p2': [] });
  let templates = safeParse('emailTemplates', []);

  function populateChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    const channel = document.getElementById('chat-channel')?.value || 'general';
    const currentUser = 'Alice Johnson'; // Replace with auth system
    if (chatMessages) {
      chatMessages.innerHTML = messages[channel].map(msg => `
        <div class="chat-message ${msg.user === currentUser ? 'sent' : 'received'}">
          <div class="message-meta">${msg.user} - ${msg.time}</div>
          ${msg.text}
        </div>
      `).join('');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function updateTemplateTable() {
    const tbody = document.getElementById('template-table-body');
    if (tbody) {
      tbody.innerHTML = templates.map(template => `
        <tr>
          <td>${template.incidentNumber}</td>
          <td>${template.priority}</td>
          <td>${template.status}</td>
          <td>
            <button class="cta-btn small" onclick="window.viewTemplate(${template.id})">View</button>
            <button class="cta-btn small" onclick="window.sendTemplate(${template.id})">Send</button>
            <button class="remove-btn small" onclick="window.removeTemplate(${template.id})">Remove</button>
          </td>
        </tr>
      `).join('');
    }
  }

  const sendMessageBtn = document.getElementById('send-message');
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      const channel = document.getElementById('chat-channel').value;
      const currentUser = 'Alice Johnson';
      if (input.value.trim()) {
        const message = {
          user: currentUser,
          text: input.value,
          time: new Date().toLocaleTimeString()
        };
        messages[channel].push(message);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        input.value = '';
        populateChatMessages();
      }
    });
  }

  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') document.getElementById('send-message')?.click();
    });
  }

  const chatChannel = document.getElementById('chat-channel');
  if (chatChannel) {
    chatChannel.addEventListener('change', populateChatMessages);
  }

  const emailTemplateForm = document.getElementById('email-template-form');
  if (emailTemplateForm) {
    emailTemplateForm.addEventListener('submit', e => {
      e.preventDefault();
      const template = {
        id: Date.now(),
        incidentNumber: document.getElementById('template-incident-number').value,
        status: document.getElementById('template-status').value,
        manager: document.getElementById('template-manager').value,
        priority: document.getElementById('template-priority').value,
        startTime: document.getElementById('template-start-time').value,
        endTime: document.getElementById('template-end-time').value,
        bridge: document.getElementById('template-bridge').value,
        details: document.getElementById('template-details').value,
        impact: document.getElementById('template-impact').value,
        recipients: Array.from(document.getElementById('template-recipients').selectedOptions).map(o => o.value)
      };
      templates.push(template);
      localStorage.setItem('emailTemplates', JSON.stringify(templates));
      showToast('Template saved successfully');
      emailTemplateForm.reset();
      updateTemplateTable();
    });
  }

  const previewTemplateBtn = document.getElementById('preview-template');
  if (previewTemplateBtn) {
    previewTemplateBtn.addEventListener('click', () => {
      const template = {
        incidentNumber: document.getElementById('template-incident-number').value,
        status: document.getElementById('template-status').value,
        manager: document.getElementById('template-manager').value,
        priority: document.getElementById('template-priority').value,
        startTime: document.getElementById('template-start-time').value,
        endTime: document.getElementById('template-end-time').value,
        bridge: document.getElementById('template-bridge').value,
        details: document.getElementById('template-details').value,
        impact: document.getElementById('template-impact').value,
        recipients: Array.from(document.getElementById('template-recipients').selectedOptions).map(o => o.value)
      };
      const preview = `
        <strong>Incident Number:</strong> ${template.incidentNumber}<br>
        <strong>Status:</strong> ${template.status}<br>
        <strong>Manager:</strong> ${template.manager}<br>
        <strong>Priority:</strong> ${template.priority}<br>
        <strong>Start Time:</strong> ${template.startTime}<br>
        <strong>Estimated End Time:</strong> ${template.endTime || 'N/A'}<br>
        <strong>Bridge Details:</strong> ${template.bridge || 'N/A'}<br>
        <strong>Incident Details:</strong> ${template.details}<br>
        <strong>Business Impact:</strong> ${template.impact}<br>
        <strong>Recipients:</strong> ${template.recipients.join(', ')}
      `;
      alert(preview); // Replace with modal for better UX
    });
  }

  window.viewTemplate = function(id) {
    const template = templates.find(t => t.id === id);
    if (template) {
      const preview = `
        <strong>Incident Number:</strong> ${template.incidentNumber}<br>
        <strong>Status:</strong> ${template.status}<br>
        <strong>Manager:</strong> ${template.manager}<br>
        <strong>Priority:</strong> ${template.priority}<br>
        <strong>Start Time:</strong> ${template.startTime}<br>
        <strong>Estimated End Time:</strong> ${template.endTime || 'N/A'}<br>
        <strong>Bridge Details:</strong> ${template.bridge || 'N/A'}<br>
        <strong>Incident Details:</strong> ${template.details}<br>
        <strong>Business Impact:</strong> ${template.impact}<br>
        <strong>Recipients:</strong> ${template.recipients.join(', ')}
      `;
      alert(preview); // Replace with modal
    }
  };

  window.sendTemplate = function(id) {
    const template = templates.find(t => t.id === id);
    if (template) {
      showToast(`Email sent to ${template.recipients.join(', ')} for Incident ${template.incidentNumber}`);
    }
  };

  window.removeTemplate = function(id) {
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates.splice(index, 1);
      localStorage.setItem('emailTemplates', JSON.stringify(templates));
      showToast('Template removed successfully');
      updateTemplateTable();
    }
  };

  // Initialize based on URL hash
  const initialPage = window.location.hash === '#communications' ? 'communications' : 'dashboard';
  window.showPage(initialPage);
});