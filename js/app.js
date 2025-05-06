document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('#toggle-btn');
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
  
    // Initialize ticket counter from localStorage or start at 0
    let ticketCounter = parseInt(localStorage.getItem('ticketCounter')) || 0;
    let currentTicketNumber = null; // Track ticket number for current form session
  
    // Sidebar toggle
    const toggleSidebar = () => {
      try {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');
        console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'Collapsed' : 'Expanded');
      } catch (error) {
        console.error('Toggle Sidebar Error:', error);
      }
    };
  
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleSidebar);
    } else {
      console.error('Toggle button not found');
    }
  
    // Disable create incident button
    createBtn.addEventListener('click', () => {
      alert('Please use the form to create an incident');
    });
  
    // Fake user profiles
    const userProfiles = {
      'alice-johnson': {
        userName: 'Alice Johnson',
        location: 'New York, NY',
        contactNumber: '212-555-0101'
      },
      'bob-smith': {
        userName: 'Bob Smith',
        location: 'Chicago, IL',
        contactNumber: '312-555-0202'
      },
      'clara-lee': {
        userName: 'Clara Lee',
        location: 'San Francisco, CA',
        contactNumber: '415-555-0303'
      },
      'david-brown': {
        userName: 'David Brown',
        location: 'Austin, TX',
        contactNumber: '512-555-0404'
      },
      'Jack-Berry': {
        userName: 'Jack Berry',
        location: 'Sandy, UT',
        contactNumber: '801-803-0608'
      }
    };
  
    // Priority Matrix
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
  
    // Priority caps (numeric rank: P1=1, P2=2, P3=3, P4=4)
    const priorityRank = {
      'P1 High': 1,
      'P2 Medium': 2,
      'P3 Low': 3,
      'P4 Low': 4
    };
  
    // Auto-populate application/service fields
    const autoPopulateData = {
      'citrix-storefront': {
        assignmentGroup: 'Citrix Team',
        category: 'Application Failure',
        shortDescription: 'Employees unable to access Citrix Storefront and virtual apps',
        businessImpact: 'Staff and external partners are unable to access Citrix Storefront and their associated virtual applications and desktops. This prevents telework or remote clinical or administrative personnel the ability to provide healthcare, benefits, or educational services.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'email-service': {
        assignmentGroup: 'IT Support',
        category: 'Service Outage',
        shortDescription: 'Users unable to send or receive emails',
        businessImpact: 'Employees and external stakeholders cannot send or receive emails, disrupting communication, delaying critical correspondence, and impacting customer service and project coordination.',
        impact: 'Medium',
        urgency: 'Medium',
        priorityCap: 'P2 Medium'
      },
      'server-cluster-a': {
        assignmentGroup: 'Server Ops',
        category: 'Hardware Failure',
        shortDescription: 'Server Cluster A offline',
        businessImpact: 'Critical services hosted on Server Cluster A are unavailable, halting multiple business applications, disrupting internal operations, and potentially causing data processing delays.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'printer-service': {
        assignmentGroup: 'Facilities IT',
        category: 'Device Issue',
        shortDescription: 'Printers offline across offices',
        businessImpact: 'Users cannot print documents, affecting physical record-keeping, shipping labels, and other operational tasks, leading to minor delays in administrative processes. Email workarounds available.',
        impact: 'Low',
        urgency: 'Low',
        priorityCap: 'P3 Low'
      },
      'billing-app': {
        assignmentGroup: 'Finance IT',
        category: 'Application Failure',
        shortDescription: 'Billing application generating errors',
        businessImpact: 'The billing application is malfunctioning, preventing invoice generation and payment processing, which risks financial discrepancies and delays in revenue collection.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'network-router': {
        assignmentGroup: 'Network Ops',
        category: 'Network Failure',
        shortDescription: 'Network router offline',
        businessImpact: 'Network connectivity is lost across multiple sites, disrupting all online operations, including customer transactions, internal communications, and cloud service access.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'helpdesk-portal': {
        assignmentGroup: 'Helpdesk Team',
        category: 'Access Issue',
        shortDescription: 'Helpdesk portal inaccessible',
        businessImpact: 'Employees cannot submit or track IT support tickets, leading to delays in issue resolution and reduced visibility into IT service requests.',
        impact: 'Medium',
        urgency: 'Medium',
        priorityCap: 'P2 Medium'
      },
      'database-b': {
        assignmentGroup: 'DBA Team',
        category: 'Database Failure',
        shortDescription: 'Database B unavailable',
        businessImpact: 'Critical data in Database B is inaccessible, halting applications reliant on it, including customer relationship management and analytics, causing operational and strategic delays.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'vpn-service': {
        assignmentGroup: 'Network Ops',
        category: 'Access Issue',
        shortDescription: 'VPN service down',
        businessImpact: 'Remote employees cannot connect to the corporate network, preventing access to internal tools and data, impacting productivity for distributed teams.',
        impact: 'Medium',
        urgency: 'Medium',
        priorityCap: 'P2 Medium'
      },
      'file-server': {
        assignmentGroup: 'Server Ops',
        category: 'Access Issue',
        shortDescription: 'File server inaccessible',
        businessImpact: 'Users cannot access shared files, disrupting collaborative projects, document sharing, and archival processes, leading to delays in team workflows.',
        impact: 'Medium',
        urgency: 'Medium',
        priorityCap: 'P2 Medium'
      },
      'sap-erp': {
        assignmentGroup: 'SAP Team',
        category: 'System Failure',
        shortDescription: 'SAP ERP module failure',
        businessImpact: 'Key SAP ERP modules are down, halting critical business processes like order processing, inventory management, and financial reporting, risking significant operational and financial losses.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'zoom-service': {
        assignmentGroup: 'Collaboration Team',
        category: 'Service Outage',
        shortDescription: 'Zoom meetings unavailable',
        businessImpact: 'Remote meetings across the organization are disrupted, preventing effective communication and collaboration for distributed teams, including sales, project management, and client engagements.',
        impact: 'Medium',
        urgency: 'Medium',
        priorityCap: 'P2 Medium'
      },
      'aws-lambda': {
        assignmentGroup: 'Cloud Ops',
        category: 'Performance Issue',
        shortDescription: 'AWS Lambda function timeout',
        businessImpact: 'Serverless workflows critical to real-time data processing and application functionality are failing, impacting customer-facing services and internal automation processes.',
        impact: 'High',
        urgency: 'High',
        priorityCap: 'P1 High'
      },
      'password-reset': {
        assignmentGroup: 'IT Support',
        category: 'Access Issue',
        shortDescription: 'User unable to reset password in Microsoft 365',
        businessImpact: 'User is unable to change password in the Microsoft 365 platform, potentially locking them out of email, collaboration tools, and cloud applications, leading to productivity loss.',
        impact: 'Low',
        urgency: 'Low',
        priorityCap: 'P4 Low'
      },
      'Access Request': {
        assignmentGroup: 'IT Support',
        category: 'Access Issue',
        shortDescription: 'User requesting access to application',
        businessImpact: 'The user is unable to access the team application platform, preventing use of collaboration tools critical for project coordination and team communication, leading to delays in task execution.',
        impact: 'Low',
        urgency: 'Low',
        priorityCap: 'P4 Low'
      }
    };
  
    // Function to format ticket number (INC + 6-digit zero-padded number)
    const formatTicketNumber = (num) => `INC${String(num).padStart(6, '0')}`;
  
    // Function to update Priority based on Application, Impact, and Urgency
    const updatePriority = () => {
      const selectedApp = appServiceSelect.value;
      const selectedImpact = impactSelect.value;
      const selectedUrgency = urgencySelect.value;
      const data = autoPopulateData[selectedApp] || {};
      const priorityCap = data.priorityCap || 'P4 Low';
      
      // Calculate base priority from matrix
      const key = `${selectedImpact}-${selectedUrgency}`;
      let priority = priorityMatrix[key] || 'P4 Low';
      
      // Enforce priority cap
      if (priorityRank[priority] < priorityRank[priorityCap]) {
        priority = priorityCap;
      }
      
      priorityInput.value = priority;
    };
  
    // Auto-populate fields on application change
    appServiceSelect.addEventListener('change', () => {
      const selectedApp = appServiceSelect.value;
      const data = autoPopulateData[selectedApp] || {};
      assignmentGroupInput.value = data.assignmentGroup || '';
      categoryInput.value = data.category || '';
      shortDescriptionInput.value = data.shortDescription || '';
      businessImpactTextarea.value = data.businessImpact || '';
      impactSelect.value = data.impact || '';
      urgencySelect.value = data.urgency || '';
      // Set ticket number only on first application selection
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
  
    // Update Priority on impact or urgency change
    impactSelect.addEventListener('change', updatePriority);
    urgencySelect.addEventListener('change', updatePriority);
  
    // Auto-populate user profile fields
    userProfileSelect.addEventListener('change', () => {
      const selectedUser = userProfileSelect.value;
      const userData = userProfiles[selectedUser] || {};
      userNameInput.value = userData.userName || '';
      locationInput.value = userData.location || '';
      contactNumberInput.value = userData.contactNumber || '';
    });
  
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!businessImpactTextarea.value || !impactSelect.value || !urgencySelect.value) {
        alert('Business Impact, Impact, and Urgency are required');
        return;
      }
      // Use existing ticket number or generate a new one
      let ticketNumber = currentTicketNumber;
      if (!ticketNumber) {
        ticketNumber = formatTicketNumber(ticketCounter);
        ticketNumberInput.value = ticketNumber;
      }
      
      const formData = {
        ticketNumber: ticketNumber,
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
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 3000);
      // Increment ticket counter and save to localStorage
      ticketCounter++;
      localStorage.setItem('ticketCounter', ticketCounter);
      form.reset();
      currentTicketNumber = null; // Reset for next ticket
      ticketNumberInput.value = 'Pending';
      userProfileSelect.dispatchEvent(new Event('change'));
      appServiceSelect.dispatchEvent(new Event('change'));
    });
  });