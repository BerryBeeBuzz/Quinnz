document.addEventListener('DOMContentLoaded', () => {
    // Page Navigation
    const pages = document.querySelectorAll('.page');
    const menuItems = document.querySelectorAll('.menu-item');
  
    function showPage(pageId) {
      pages.forEach(page => {
        page.style.display = page.id === pageId ? 'block' : 'none';
      });
      menuItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('onclick')?.includes(pageId));
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
        console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'Collapsed' : 'Expanded');
      });
    } else {
      console.error('Toggle button not found');
    }
  
    // Dashboard Functionality (from https://codepen.io/Berry-Bee/pen/yyyMGdG)
    // Page Contact Function for On-Call Schedule
    function pageContact(name, team) {
      alert(`Paging ${name} for ${team} team...`);
    }
  
    // Initialize Muuri Grid
    let grid;
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
  
    // Add New Widget
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
  
    // Dashboard Charts (simplified; add all charts as in original CodePen)
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
    } catch (error) {
      console.error('Incident Chart failed:', error);
    }
  
    // Ticket Form Functionality (from https://codepen.io/Berry-Bee/pen/wBBqryr)
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
        showPage('create-ticket');
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
      // Add other autoPopulateData entries as in original CodePen
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
  
    // Settings Functionality (from https://codepen.io/Berry-Bee/pen/PwwQmyY)
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
  
    let autoPopulateDataSettings = JSON.parse(localStorage.getItem('autoPopulateData')) || {
      'citrix-storefront': { assignmentGroup: 'Citrix Team', category: 'Application Failure', shortDescription: 'Employees unable to access Citrix Storefront and virtual apps', businessImpact: 'Staff and external partners are unable to access Citrix Storefront and their associated virtual applications and desktops.', impact: 'High', urgency: 'High', priorityCap: 'P1 High' },
      // Add other entries as in original CodePen
    };
  
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
          showToast('Logged in successfully');
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
        showToast('User added successfully');
      });
    }
  
    if (appForm) {
      appForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const appName = document.getElementById('app-name').value;
        const key = appName.toLowerCase().replace(/\s+/g, '-');
        autoPopulateDataSettings[key] = {
          assignmentGroup: document.getElementById('app-assignment-group').value,
          category: document.getElementById('app-category').value,
          shortDescription: document.getElementById('app-short-description').value,
          businessImpact: document.getElementById('app-business-impact').value,
          impact: document.getElementById('app-impact').value,
          urgency: document.getElementById('app-urgency').value,
          priorityCap: document.getElementById('app-priority-cap').value
        };
        updateAppTable();
        appForm.reset();
        showToast('Application/Service added successfully');
      });
    }
  
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        const key = e.target.dataset.key;
        if (userProfilesSettings[key]) {
          delete userProfilesSettings[key];
          updateUserTable();
          showToast('User removed');
        } else if (autoPopulateDataSettings[key]) {
          delete autoPopulateDataSettings[key];
          updateAppTable();
          showToast('Application/Service removed');
        }
      }
    });
  
    // Initialize Dashboard
    showPage('dashboard');
  });