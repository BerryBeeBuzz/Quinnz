document.addEventListener('DOMContentLoaded', () => {
    // Page Navigation
    const pages = document.querySelectorAll('.page');
    const menuItems = document.querySelectorAll('.menu-item');
    let grid = null;
  
    function showPage(pageId) {
      try {
        // Toggle page visibility
        pages.forEach(page => {
          page.style.display = page.id === pageId ? 'block' : 'none';
        });
  
        // Update active menu item
        menuItems.forEach(item => {
          const onclickAttr = item.getAttribute('onclick') || '';
          const isActive = onclickAttr.includes(`showPage('${pageId}')`);
          item.classList.toggle('active', isActive);
        });
  
        // Reinitialize Muuri grid for dashboard
        if (pageId === 'dashboard' && grid) {
          grid.refreshItems().layout();
        }
  
        console.log(`Navigated to page: ${pageId}`);
      } catch (error) {
        console.error('Error in showPage:', error);
      }
    }
  
    // Event Delegation for Menu Items
    document.querySelector('.menu').addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        const onclickAttr = menuItem.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('showPage')) {
          const pageIdMatch = onclickAttr.match(/showPage\('([^']+)'\)/);
          if (pageIdMatch) {
            showPage(pageIdMatch[1]);
          }
        }
      }
    });
  
    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('#toggle-btn');
  
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');
        console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'Collapsed' : 'Expanded');
        if (grid) {
          grid.refreshItems().layout();
        }
      });
    } else {
      console.error('Toggle button not found');
    }
  
    // Dashboard Functionality
    function pageContact(name, team) {
      alert(`Paging ${name} for ${team} team...`);
    }
  
    try {
      if (typeof Muuri === 'undefined') {
        throw new Error('Muuri library not loaded');
      }
      grid = new Muuri('.widget-grid.muuri', {
        dragEnabled: true,
        layout: {
          fillGaps: false,
          horizontal: false,
          alignRight: false,
          alignBottom: false,
          rounding: false
        },
        dragSortHeuristics: {
          sortInterval: 10,
          minDragDistance: 10
        },
        dragSortPredicate: {
          threshold: 50,
          action: 'swap'
        },
        dragRelease: {
          duration: 300,
          easing: 'ease-out',
          useDragContainer: true
        },
        dragCssProps: {
          touchAction: 'none',
          userSelect: 'none',
          userDrag: 'none',
          tapHighlightColor: 'transparent'
        }
      });
      grid.refreshItems().layout();
      window.addEventListener('resize', () => {
        grid.refreshItems().layout();
      });
    } catch (error) {
      console.error('Muuri initialization failed:', error);
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
        grid.add(newWidget, { index: -1, layout: true });
      });
    }
  
    // Dashboard Charts
    try {
      const incidentChart = document.getElementById('incidentChart')?.getContext('2d');
      if (incidentChart) {
        new Chart(incidentChart, {
          type: 'pie',
          data: {
            labels: ['Open', 'In Progress', 'Resolved'],
            datasets: [{
              data: [15, 8, 22],
              backgroundColor: ['#60A5FA', '#FBBF24', '#22C55E'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
  
      const priorityChart = document.getElementById('priorityChart')?.getContext('2d');
      if (priorityChart) {
        new Chart(priorityChart, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
              {
                label: 'P1 High',
                data: [5, 3, 4, 2, 1],
                borderColor: '#EF4444',
                fill: true
              },
              {
                label: 'P2 Medium',
                data: [10, 8, 7, 9, 6],
                borderColor: '#FBBF24',
                fill: true
              },
              {
                label: 'P3 Low',
                data: [15, 12, 14, 11, 13],
                borderColor: '#60A5FA',
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
  
      const slaChart = document.getElementById('slaChart')?.getContext('2d');
      if (slaChart) {
        new Chart(slaChart, {
          type: 'doughnut',
          data: {
            labels: ['On Track', 'At Risk'],
            datasets: [{
              data: [92, 8],
              backgroundColor: ['#22C55E', '#EF4444'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
  
      const dynatraceChart = document.getElementById('dynatraceChart')?.getContext('2d');
      if (dynatraceChart) {
        new Chart(dynatraceChart, {
          type: 'line',
          data: {
            labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM'],
            datasets: [{
              label: 'CPU Usage (%)',
              data: [20, 30, 25, 40, 35],
              borderColor: '#4F46E5',
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
  
      const splunkChart = document.getElementById('splunkChart')?.getContext('2d');
      if (splunkChart) {
        new Chart(splunkChart, {
          type: 'line',
          data: {
            labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM'],
            datasets: [{
              label: 'Error Rate',
              data: [5, 10, 8, 12, 7],
              borderColor: '#EF4444',
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
  
      const changeTicketsChart = document.getElementById('changeTicketsChart')?.getContext('2d');
      if (changeTicketsChart) {
        new Chart(changeTicketsChart, {
          type: 'bar',
          data: {
            labels: ['Open', 'In Review', 'Approved'],
            datasets: [{
              label: 'Change Tickets',
              data: [10, 5, 3],
              backgroundColor: '#4F46E5'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
  
      const pagerDutyChart = document.getElementById('pagerDutyChart')?.getContext('2d');
      if (pagerDutyChart) {
        new Chart(pagerDutyChart, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
              label: 'Incidents',
              data: [3, 5, 2, 4, 1],
              borderColor: '#FBBF24',
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
  
      const responseTimeChart = document.getElementById('responseTimeChart')?.getContext('2d');
      if (responseTimeChart) {
        new Chart(responseTimeChart, {
          type: 'bar',
          data: {
            labels: ['P1', 'P2', 'P3'],
            datasets: [{
              label: 'Response Time (min)',
              data: [10, 20, 30],
              backgroundColor: '#60A5FA'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
  
      const serviceHealthChart = document.getElementById('serviceHealthChart')?.getContext('2d');
      if (serviceHealthChart) {
        new Chart(serviceHealthChart, {
          type: 'bar',
          data: {
            labels: ['P1', 'P2', 'P3'],
            datasets: [{
              label: 'Incidents',
              data: [3, 5, 7],
              backgroundColor: ['#EF4444', '#FBBF24', '#60A5FA']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    } catch (error) {
      console.error('Chart initialization failed:', error);
    }
  
    // Incidents (Ticket Form) Functionality
    const createBtn = document.querySelector('.create-btn');
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
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
  
    let ticketCounter = parseInt(localStorage.getItem('ticketCounter')) || 0;
    let currentTicketNumber = null;
  
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        showPage('incidents');
      });
    }
  
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
          alert('Business Impact, Impact, and Urgency are required');
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
        console.log('Incident Created:', formData);
        toastMessage.textContent = `An incident has been created and sent for review. Ticket Number: ${ticketNumber}`;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3000);
        ticketCounter++;
        localStorage.setItem('ticketCounter', ticketCounter);
        form.reset();
        currentTicketNumber = null;
        ticketNumberInput.value = 'Pending';
        userProfileSelect.dispatchEvent(new Event('change'));
        appServiceSelect.dispatchEvent(new Event('change'));
      });
    }
  
    // Settings Functionality
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
  
    const showToast = (message) => {
      toastMessage.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 3000);
    };
  
    const updateUserTable = () => {
      userTableBody.innerHTML = '';
      Object.entries(userProfilesSettings).forEach(([key, user]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.userName}</td>
          <td>${user.location}</td>
          <td>${user.email