// Global variables
let products = [];
let clients = [];
let allProducts = []; // Stores all products including inactive ones
let allClients = []; // Stores all clients including inactive ones
let bolItems = [];
let poNumbers = [];
let totalWeight = 0;

// Custom CSS styles for animations and transitions
const customStyles = `
  /* Animations and transitions */
  .btn-pulse {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
    }
  }
  
  .items-updated {
    animation: highlight 0.5s ease-in-out;
  }
  
  @keyframes highlight {
    0% {
      background-color: rgba(0, 123, 255, 0.1);
    }
    100% {
      background-color: transparent;
    }
  }
  
  .filtering tbody {
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }
  
  /* Table row hover effect */
  .table-hover tbody tr {
    transition: all 0.2s ease;
  }
  
  .table-hover tbody tr:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 1;
    position: relative;
  }
  
  /* Button hover effects */
  .btn {
    transition: all 0.3s ease;
  }
  
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Card hover effects */
  .card {
    transition: all 0.3s ease;
  }
  
  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  /* Form control focus effect */
  .form-control, .form-select {
    transition: all 0.2s ease;
  }
  
  .form-control:focus, .form-select:focus {
    transform: translateY(-2px);
  }
  
  /* Toast animations */
  .toast {
    animation: slideIn 0.3s ease forwards;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  /* Tab transition */
  .tab-pane {
    transition: opacity 0.3s ease;
  }
  
  .tab-pane.show {
    animation: fadeIn 0.3s ease forwards;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  /* Modal animations */
  .modal-dialog {
    transform: scale(0.8);
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .modal.show .modal-dialog {
    transform: scale(1);
    opacity: 1;
  }
`;

// Function to apply custom styles on page load
function applyCustomStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
  
  console.log('Applied custom animation styles');
}

// Enhanced show/hide functions for elements with animations
function showHideElementWithAnimation(elementId, show) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (show) {
    // First set display to flex/block so the animation works
    element.style.display = element.classList.contains('d-flex') ? 'flex' : 'block';
    element.style.opacity = 0;
    
    // Trigger animation
    setTimeout(() => {
      element.style.transition = 'opacity 0.3s ease';
      element.style.opacity = 1;
    }, 10);
  } else {
    // Fade out
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = 0;
    
    // After animation completes, hide the element
    setTimeout(() => {
      element.style.display = 'none';
    }, 300);
  }
}

// Function to populate the client dropdown in the BOL form - enhanced with location details
function populateClientDropdown() {
  const clientSelect = document.getElementById('clientSelect');
  console.log("Populating client dropdown, clientSelect exists:", !!clientSelect);
  console.log("Number of clients available:", clients.length);
  
  if (!clientSelect) return;

  // Clear existing options
  clientSelect.innerHTML = '<option value="">Select a client...</option>';
  
  // Sort clients alphabetically by name
  const sortedClients = [...clients].sort((a, b) => {
    const nameA = (a["Client Name"] || "").toLowerCase();
    const nameB = (b["Client Name"] || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Group clients by state
  const clientsByState = sortedClients.reduce((groups, client) => {
    const state = client["State"] || "Other";
    if (!groups[state]) {
      groups[state] = [];
    }
    groups[state].push(client);
    return groups;
  }, {});
  
  // Sort states alphabetically
  const sortedStates = Object.keys(clientsByState).sort();
  
  // Add clients grouped by state
  sortedStates.forEach(state => {
    const stateGroup = document.createElement('optgroup');
    stateGroup.label = state;
    
    clientsByState[state].forEach(client => {
      const option = document.createElement('option');
      option.value = client["Client Code"];
      option.textContent = `${client["Client Name"]} (${client["City"]}, ${client["State"]})`;
      stateGroup.appendChild(option);
    });
    
    clientSelect.appendChild(stateGroup);
  });
}

// Enhanced client selection handling
function handleClientSelection() {
  const clientSelect = document.getElementById('clientSelect');
  const selectedClientCode = clientSelect.value;
  
  // If no client selected, do nothing
  if (!selectedClientCode) return;
  
  // Find the selected client
  const selectedClient = clients.find(c => c["Client Code"] === selectedClientCode);
  if (!selectedClient) return;
  
  // Show a small loading indicator in the form fields
  const toFields = ['toName', 'toAddress', 'toCity', 'toState', 'toZip'];
  toFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add('bg-light');
      field.setAttribute('readonly', true);
      field.value = 'Loading...';
    }
  });
  
  // Simulate a slight delay for better UX
  setTimeout(() => {
    // Fill in the TO fields with client data
    document.getElementById('toName').value = selectedClient["Client Name"] || '';
    document.getElementById('toAddress').value = selectedClient["Address"] || '';
    document.getElementById('toCity').value = selectedClient["City"] || '';
    document.getElementById('toState').value = selectedClient["State"] || '';
    document.getElementById('toZip').value = selectedClient["ZIP"] || '';
    
    // Remove loading indicator
    toFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.remove('bg-light');
        field.removeAttribute('readonly');
      }
    });
    
    // Show a success notification
    showNotification(`Client ${selectedClient["Client Name"]} selected`, 'success');
  }, 300);
}

// Add event listeners related to client selection
function setupClientSelectionListeners() {
  const clientSelect = document.getElementById('clientSelect');
  if (clientSelect) {
    clientSelect.addEventListener('change', handleClientSelection);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM content loaded, initializing application...");
  
  // Check authentication first
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  
  if (!isLoggedIn && !rememberMe) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }
  
  // Apply custom styles
  applyCustomStyles();
  
  // Set today's date as default
  const dateInput = document.getElementById('shipDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  
  // Setup event listeners for BOL generation
  setupBolEventListeners();
  
  // Setup inventory event listeners
  setupInventoryEventListeners();
  
  // Setup clients event listeners
  setupClientsEventListeners();
  
  // Setup product management event listeners
  setupProductManagementListeners();
  
  // Setup client management event listeners
  setupClientManagementListeners();
  
  // Load inventory from server
  loadInventoryFromServer();
  
  // Load clients from server
  loadClientsFromServer();
  
  // Additional event listeners for enhanced functionality
  // Add hover effects for navigation tabs
  const navTabs = document.querySelectorAll('.nav-link');
  navTabs.forEach(tab => {
    tab.addEventListener('mouseenter', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(0, 59, 113, 0.1)';
      }
    });
    
    tab.addEventListener('mouseleave', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = '';
        this.style.boxShadow = '';
      }
    });
  });
  
  // Enhanced form validation
  const formInputs = document.querySelectorAll('.form-control, .form-select');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused-input');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused-input');
      
      // Simple validation
      if (this.hasAttribute('required') && !this.value.trim()) {
        this.classList.add('is-invalid');
      } else {
        this.classList.remove('is-invalid');
        if (this.value.trim()) {
          this.classList.add('is-valid');
        } else {
          this.classList.remove('is-valid');
        }
      }
    });
  });
});

// Setup event listeners for BOL generation
function setupBolEventListeners() {
  const addPoBtn = document.getElementById('addPoBtn');
  if (addPoBtn) {
    addPoBtn.addEventListener('click', addPoNumber);
  }
  
  const addItemBtn = document.getElementById('addItemBtn');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', addBolItem);
  }
  
  const addPalletBtn = document.getElementById('addPalletBtn');
  if (addPalletBtn) {
    addPalletBtn.addEventListener('click', addPallet);
  }
  
  const addFirstItemBtn = document.getElementById('addFirstItemBtn');
  if (addFirstItemBtn) {
    addFirstItemBtn.addEventListener('click', addBolItem);
  }
  
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateDocument);
  }
  
  // Add event listener for clear items button
  const clearItemsBtn = document.getElementById('clearItemsBtn');
  if (clearItemsBtn) {
    clearItemsBtn.addEventListener('click', clearAllItems);
  }
  
  // Setup client selection dropdown
  setupClientSelectionListeners();
}

// Enhanced clear items function with confirmation
function clearAllItems() {
  // Check if there are any items to clear
  if (bolItems.length === 0) {
    showNotification('No items to clear', 'info');
    return;
  }
  
  // Create a more modern confirmation dialog
  const confirmModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
  document.getElementById('confirmationTitle').textContent = 'Clear All Items';
  document.getElementById('confirmationMessage').innerHTML = `
    <div class="text-center mb-3">
      <i class="fas fa-exclamation-circle text-warning" style="font-size: 3rem;"></i>
    </div>
    <p>Are you sure you want to remove all ${bolItems.length} items from the bill of lading?</p>
    <p class="text-muted small">This action cannot be undone.</p>
  `;
  
  // Set up the confirm button
  const confirmActionBtn = document.getElementById('confirmActionBtn');
  if (confirmActionBtn) {
    confirmActionBtn.dataset.action = 'clearAllItems';
    
    // Replace any existing event listener
    const newButton = confirmActionBtn.cloneNode(true);
    confirmActionBtn.parentNode.replaceChild(newButton, confirmActionBtn);
    
    // Add the new event listener
    newButton.addEventListener('click', () => {
      // Clear the bolItems array
      bolItems = [];
      
      // Update the UI
      updateItemsList();
      
      // Hide the modal
      confirmModal.hide();
      
      showNotification('All items have been cleared', 'success');
    });
  }
  
  confirmModal.show();
}

// Setup event listeners for inventory management
function setupInventoryEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshInventoryBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadInventoryFromServer);
  }
  
  // Export button
  const exportBtn = document.getElementById('exportInventoryBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportInventory);
  }
  
  // Add new product button
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', openAddProductModal);
  }
  
  // Filters
  const showActiveOnly = document.getElementById('showActiveOnly');
  if (showActiveOnly) {
    showActiveOnly.addEventListener('change', filterInventoryTable);
  }
  
  const showHazmatOnly = document.getElementById('showHazmatOnly');
  if (showHazmatOnly) {
    showHazmatOnly.addEventListener('change', filterInventoryTable);
  }
  
  // Search
  const searchInput = document.getElementById('inventorySearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterInventoryTable);
  }
  
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function() {
      document.getElementById('inventorySearch').value = '';
      filterInventoryTable();
    });
  }
}

// Setup event listeners for clients management
function setupClientsEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshClientsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadClientsFromServer);
  }
  
  // Export button
  const exportBtn = document.getElementById('exportClientsBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportClients);
  }
  
  // Add new client button
  const addClientBtn = document.getElementById('addClientBtn');
  if (addClientBtn) {
    addClientBtn.addEventListener('click', openAddClientModal);
  }
  
  // Filters
  const showActiveClientsOnly = document.getElementById('showActiveClientsOnly');
  if (showActiveClientsOnly) {
    showActiveClientsOnly.addEventListener('change', filterClientsTable);
  }
  
  // Search
  const searchInput = document.getElementById('clientsSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterClientsTable);
  }
  
  const clearSearchBtn = document.getElementById('clearClientSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function() {
      document.getElementById('clientsSearch').value = '';
      filterClientsTable();
    });
  }
}

// Setup modals and product management listeners
function setupProductManagementListeners() {
  // Product form save button
  const saveProductBtn = document.getElementById('saveProductBtn');
  if (saveProductBtn) {
    saveProductBtn.addEventListener('click', saveProduct);
  }
  
  // Delete product button
  const deleteProductBtn = document.getElementById('deleteProductBtn');
  if (deleteProductBtn) {
    deleteProductBtn.addEventListener('click', confirmDeleteProduct);
  }
  
  // Confirm action button
  const confirmActionBtn = document.getElementById('confirmActionBtn');
  if (confirmActionBtn) {
    confirmActionBtn.addEventListener('click', executeConfirmedAction);
  }
  
  // Set up hazmat selection changes
  const inventoryTypeSelect = document.getElementById('inventoryType');
  const isHazardousMaterialSelect = document.getElementById('isHazardousMaterial');
  if (inventoryTypeSelect && isHazardousMaterialSelect) {
    // Sync inventory type and hazmat selection
    inventoryTypeSelect.addEventListener('change', function() {
      if (this.value === 'HAZMAT') {
        isHazardousMaterialSelect.value = 'x';
      } else {
        isHazardousMaterialSelect.value = '';
      }
    });
    
    isHazardousMaterialSelect.addEventListener('change', function() {
      if (this.value === 'x') {
        inventoryTypeSelect.value = 'HAZMAT';
      } else {
        inventoryTypeSelect.value = 'NON-HAZMAT';
      }
    });
  }
}

// Setup modals and client management listeners
function setupClientManagementListeners() {
  // Client form save button
  const saveClientBtn = document.getElementById('saveClientBtn');
  if (saveClientBtn) {
    saveClientBtn.addEventListener('click', saveClient);
  }
  
  // Delete client button
  const deleteClientBtn = document.getElementById('deleteClientBtn');
  if (deleteClientBtn) {
    deleteClientBtn.addEventListener('click', confirmDeleteClient);
  }
}

// Enhanced load inventory from server with better visual feedback
function loadInventoryFromServer() {
  console.log("Loading inventory from server...");
  
  // Display loading message
  const productCount = document.getElementById('productCount');
  if (productCount) {
    productCount.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Loading products...';
  }
  
  // Also add a loading indicator to the table
  const tbody = document.getElementById('inventoryTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="19" class="text-center p-5">
          <div class="d-flex flex-column align-items-center">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Loading inventory data from server...</p>
          </div>
        </td>
      </tr>
    `;
  }
  
    fetch('/api/inventory')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Received data from server:", data);
      
      if (data.products && Array.isArray(data.products)) {
        allProducts = data.products;
        
        // Sort all products alphabetically by name
        allProducts.sort((a, b) => {
          const nameA = (a["Product Name"] || "").toLowerCase();
          const nameB = (b["Product Name"] || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        // Log a sample product to verify structure
        if (allProducts.length > 0) {
          console.log("Sample product:", allProducts[0]);
        }
        
        // Filter to only active products for BOL generation
        products = allProducts.filter(product => 
          product["Active Status"] === "Active"
        );
        
        // Update UI elements
        renderInventoryTable(allProducts);
        showProductCount();
        
        showNotification('Inventory loaded successfully', 'success');
        console.log(`Loaded ${allProducts.length} products (${products.length} active)`);
      } else {
        console.error("Invalid data format or empty data received from server", data);
        renderInventoryTable([]); // Render empty table
        showNotification('No products found or error loading inventory', 'warning');
      }
      
      return data; // Return data for promise chain
    })
    .catch(error => {
      console.error('Error loading inventory:', error);
      renderInventoryTable([]); // Render empty table
      
      // Show error and offer to load mock data
      showNotification('Error loading inventory from server', 'danger');
      
      // Create a more detailed error dialog
      const confirmModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
      document.getElementById('confirmationTitle').textContent = 'Connection Error';
      document.getElementById('confirmationMessage').innerHTML = `
        <div class="text-center mb-3">
          <i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
        </div>
        <p>Unable to connect to the server: <code>${error.message}</code></p>
        <p>Would you like to load mock data for testing purposes?</p>
      `;
      
      // Set up the confirm button
      const confirmActionBtn = document.getElementById('confirmActionBtn');
      if (confirmActionBtn) {
        confirmActionBtn.textContent = 'Load Mock Data';
        confirmActionBtn.className = 'btn btn-primary';
        
        // Replace any existing event listener
        const newButton = confirmActionBtn.cloneNode(true);
        confirmActionBtn.parentNode.replaceChild(newButton, confirmActionBtn);
        
        // Add the new event listener
        newButton.addEventListener('click', () => {
          loadMockInventoryData();
          confirmModal.hide();
        });
      }
      
      confirmModal.show();
      throw error; // Re-throw error for promise chain
    });
}

// Load clients from server with enhanced UI feedback
function loadClientsFromServer() {
  console.log("Loading clients from server...");
  
  // Display loading message
  const clientCount = document.getElementById('clientCount');
  if (clientCount) {
    clientCount.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Loading clients...';
  }
  
  // Also add a loading indicator to the table
  const tbody = document.getElementById('clientsTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center p-5">
          <div class="d-flex flex-column align-items-center">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Loading clients data from server...</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  fetch('/api/clients')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Received clients data from server:", data);
      
      if (data.clients && Array.isArray(data.clients)) {
        allClients = data.clients;
        
        // Log a sample client to verify structure
        if (allClients.length > 0) {
          console.log("Sample client:", allClients[0]);
        }
        
        // Filter to only active clients
        clients = allClients.filter(client => 
          client["Status"] === "Active"
        );
        
        // Update UI elements
        renderClientsTable(allClients);
        showClientCount();
        
        // Also populate the client dropdown in the BOL form
        populateClientDropdown();
        
        showNotification('Clients loaded successfully', 'success');
        console.log(`Loaded ${allClients.length} clients (${clients.length} active)`);
      } else {
        console.error("Invalid data format or empty data received from server", data);
        renderClientsTable([]); // Render empty table
        showNotification('No clients found or error loading clients', 'warning');
      }
    })
    .catch(error => {
      console.error('Error loading clients:', error);
      renderClientsTable([]); // Render empty table
      
      // Show error and offer to load mock data
      showNotification('Error loading clients from server', 'danger');
      
      // Create a more detailed error dialog
      const confirmModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
      document.getElementById('confirmationTitle').textContent = 'Connection Error';
      document.getElementById('confirmationMessage').innerHTML = `
        <div class="text-center mb-3">
          <i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
        </div>
        <p>Unable to connect to the server: <code>${error.message}</code></p>
        <p>Would you like to load mock client data for testing purposes?</p>
      `;
      
      // Set up the confirm button
      const confirmActionBtn = document.getElementById('confirmActionBtn');
      if (confirmActionBtn) {
        confirmActionBtn.textContent = 'Load Mock Data';
        confirmActionBtn.className = 'btn btn-primary';
        
        // Replace any existing event listener
        const newButton = confirmActionBtn.cloneNode(true);
        confirmActionBtn.parentNode.replaceChild(newButton, confirmActionBtn);
        
        // Add the new event listener
        newButton.addEventListener('click', () => {
          loadMockClientsData();
          confirmModal.hide();
        });
      }
      
      confirmModal.show();
    });
}

// Export inventory to CSV
function exportInventory() {
  if (allProducts.length === 0) {
    showNotification('No inventory data to export', 'warning');
    return;
  }
  
  // Show loading indicator
  showNotification('Preparing inventory export...', 'info');
  
  // Create CSV content
  const headers = Object.keys(allProducts[0]).join(',');
  
  // Create CSV rows, properly handling commas
  const rows = allProducts.map(product => {
    return Object.values(product).map(value => {
      // Handle values with commas by wrapping in quotes
      if (value && typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value !== null && value !== undefined ? value : '';
    }).join(',');
  });
  
  // Combine headers and rows
  const csv = [headers, ...rows].join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showNotification('Inventory exported successfully', 'success');
}

// Export clients to CSV
function exportClients() {
  if (allClients.length === 0) {
    showNotification('No clients data to export', 'warning');
    return;
  }
  
  // Show loading indicator
  showNotification('Preparing clients export...', 'info');
  
  // Create CSV content
  const headers = Object.keys(allClients[0]).join(',');
  
  // Create CSV rows, properly handling commas
  const rows = allClients.map(client => {
    return Object.values(client).map(value => {
      // Handle values with commas by wrapping in quotes
      if (value && typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value !== null && value !== undefined ? value : '';
    }).join(',');
  });
  
  // Combine headers and rows
  const csv = [headers, ...rows].join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Clients_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showNotification('Clients exported successfully', 'success');
}

// Show notification - enhanced with icon and styling
function showNotification(message, type) {
  console.log(`Notification (${type}): ${message}`);
  
  // Get the toast element and set appropriate styling
  const toast = document.getElementById('notification');
  if (!toast) {
    alert(message); // Fallback to alert if toast element not found
    return;
  }
  
  // Set the message
  const toastMessage = document.getElementById('toastMessage');
  if (toastMessage) {
    toastMessage.textContent = message;
  }
  
  // Set the appropriate background color based on notification type
  toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
  let icon = '';
  
  switch (type) {
    case 'success':
      toast.classList.add('bg-success');
      icon = 'check-circle';
      break;
    case 'danger':
      toast.classList.add('bg-danger');
      icon = 'exclamation-circle';
      break;
    case 'warning':
      toast.classList.add('bg-warning');
      icon = 'exclamation-triangle';
      break;
    case 'info':
    default:
      toast.classList.add('bg-info');
      icon = 'info-circle';
      break;
  }
  
  // Update the icon
  const iconElement = toastMessage.previousElementSibling;
  if (iconElement && iconElement.tagName === 'I') {
    iconElement.className = `fas fa-${icon} me-2`;
  }
  
  // Show the toast
  const toastInstance = new bootstrap.Toast(toast);
  toastInstance.show();
}

// Enhanced filter functions with animation
function filterInventoryTable() {
  const showActiveOnly = document.getElementById('showActiveOnly').checked;
  const showHazmatOnly = document.getElementById('showHazmatOnly').checked;
  const searchInput = document.getElementById('inventorySearch');
  const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
  
  // Show filtering indicator
  const tbody = document.getElementById('inventoryTableBody');
  if (tbody) {
    tbody.classList.add('filtering');
  }
  
  let filteredData = [...allProducts];
  
  // Apply active filter
  if (showActiveOnly) {
    filteredData = filteredData.filter(product => product["Active Status"] === "Active");
  }
  
  // Apply hazmat filter
  if (showHazmatOnly) {
    filteredData = filteredData.filter(product => product["Hazardous Material? (x if Yes)"]);
  }
  
  // Apply search filter
  if (searchValue.trim() !== '') {
    filteredData = filteredData.filter(product => {
      const name = product["Product Name"] ? String(product["Product Name"]).toLowerCase() : "";
      const code = product["Product Code"] ? String(product["Product Code"]).toLowerCase() : "";
      const desc = product["Product Description"] ? String(product["Product Description"]).toLowerCase() : "";
      
      return name.includes(searchValue) || code.includes(searchValue) || desc.includes(searchValue);
    });
  }
  
  // Short delay for smoother UX
  setTimeout(() => {
    // Render filtered data
    renderInventoryTable(filteredData);
    
    // Remove filtering class
    if (tbody) {
      tbody.classList.remove('filtering');
    }
    
    // Show result count
    if (filteredData.length === 0) {
      showNotification('No matching products found', 'info');
    } else if (filteredData.length < allProducts.length) {
      showNotification(`Showing ${filteredData.length} of ${allProducts.length} products`, 'info');
    }
  }, 300);
}

// Filter clients table based on search and filters with animation
function filterClientsTable() {
  const showActiveOnly = document.getElementById('showActiveClientsOnly').checked;
  const searchInput = document.getElementById('clientsSearch');
  const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
  
  // Show filtering indicator
  const tbody = document.getElementById('clientsTableBody');
  if (tbody) {
    tbody.classList.add('filtering');
  }
  
  let filteredData = [...allClients];
  
  // Apply active filter
  if (showActiveOnly) {
    filteredData = filteredData.filter(client => client["Status"] === "Active");
  }
  
  // Apply search filter
  if (searchValue.trim() !== '') {
    filteredData = filteredData.filter(client => {
      const name = client["Client Name"] ? String(client["Client Name"]).toLowerCase() : "";
      const code = client["Client Code"] ? String(client["Client Code"]).toLowerCase() : "";
      const address = client["Address"] ? String(client["Address"]).toLowerCase() : "";
      const city = client["City"] ? String(client["City"]).toLowerCase() : "";
      
      return name.includes(searchValue) || code.includes(searchValue) || 
        address.includes(searchValue) || city.includes(searchValue);
    });
  }
  
  // Short delay for smoother UX
  setTimeout(() => {
    // Render filtered data
    renderClientsTable(filteredData);
    
    // Remove filtering class
    if (tbody) {
      tbody.classList.remove('filtering');
    }
    
    // Show result count
    if (filteredData.length === 0) {
      showNotification('No matching clients found', 'info');
    } else if (filteredData.length < allClients.length) {
      showNotification(`Showing ${filteredData.length} of ${allClients.length} clients`, 'info');
    }
  }, 300);
}

// Render inventory table with given data - enhanced styling
function renderInventoryTable(data) {
  console.log("Rendering inventory table with", data.length, "products");
  const tbody = document.getElementById('inventoryTableBody');
  
  if (!tbody) {
    console.error("Inventory table body not found");
    return;
  }
  
  // Clear the current table
  tbody.innerHTML = '';
  
  // If no data, show a message
  if (data.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 19; // Span all columns (added Actions column)
    emptyCell.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No products found. Try refreshing or check server connection.</p>
        <button class="btn btn-sm btn-outline-primary" onclick="loadInventoryFromServer()">
          <i class="fas fa-sync-alt me-1"></i> Refresh Inventory
        </button>
      </div>
    `;
    emptyCell.className = 'text-center p-3';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }
  
  // Sort products alphabetically by name
  data.sort((a, b) => {
    const nameA = (a["Product Name"] || "").toLowerCase();
    const nameB = (b["Product Name"] || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Helper function to safely handle cell content
  const safeValue = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };
  
  // Define the column order
  const columnOrder = [
    "Product Name",
    "Product Code",
    "U/M",
    "Product Description",
    "Grade",
    "NMFC #",
    "Freight Class",
    "Packing Group",
    "Net Weight (Per Package)",
    "Gross Weight (Per Package)",
    "Stackable?",
    "Hazardous Material? (x if Yes)",
    "Hazmat Class",
    "Non Hazmat Class",
    "Account",
    "Price",
    "Active Status",
  ];
  
  // Add products to table
  data.forEach(product => {
    const row = document.createElement('tr');
    
    // Add a class for active/inactive products
    if (product["Active Status"] !== "Active") {
      row.classList.add('table-secondary');
    }
    
    // Add a class for hazmat products
    if (product["Hazardous Material? (x if Yes)"]) {
      row.classList.add('table-warning');
    }
    
    // Add action buttons cell
    const actionsTd = document.createElement('td');
    actionsTd.className = 'action-btn-container';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-primary inventory-action-btn';
    editBtn.innerHTML = '<i class="fas fa-edit me-1"></i> Edit';
    editBtn.addEventListener('click', () => openEditProductModal(product["ID"]));
    actionsTd.appendChild(editBtn);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger inventory-action-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete';
    deleteBtn.addEventListener('click', () => confirmDeleteProduct(product["ID"]));
    actionsTd.appendChild(deleteBtn);
    
    row.appendChild(actionsTd);
    
    // Add cells in the defined order
    columnOrder.forEach(key => {
      const td = document.createElement('td');
      let value = product[key];
      
      // Special formatting for hazmat column
      if (key === "Hazardous Material? (x if Yes)") {
        if (value) {
          td.innerHTML = '<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i> Yes</span>';
        } else {
          td.textContent = "No";
        }
      } 
      // Special formatting for Active Status
      else if (key === "Active Status") {
        if (value === "Active") {
          td.innerHTML = '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Active</span>';
        } else {
          td.innerHTML = '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i> Inactive</span>';
        }
      }
      // Special formatting for Inventory Type
      else if (key === "Inventory Type") {
        if (value === "HAZMAT") {
          td.innerHTML = '<span class="badge bg-warning text-dark"><i class="fas fa-biohazard me-1"></i> HAZMAT</span>';
        } else {
          td.innerHTML = '<span class="badge bg-info text-dark"><i class="fas fa-box me-1"></i> NON-HAZMAT</span>';
        }
      }
      // Format numeric values
      else if (key === "Net Weight (Per Package)" || key === "Gross Weight (Per Package)" || key === "Price") {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          td.textContent = numValue.toFixed(2);
          td.style.textAlign = 'right';
        } else {
          td.textContent = safeValue(value);
        }
      } 
      // Default formatting
      else {
        td.textContent = safeValue(value);
      }
      
      row.appendChild(td);
    });
    
    // Add row to table
    tbody.appendChild(row);
  });
  
  // Update product count
  showProductCount(data.length);
}

// Render clients table with given data - enhanced styling
function renderClientsTable(data) {
  console.log("Rendering clients table with", data.length, "clients");
  const tbody = document.getElementById('clientsTableBody');
  
  if (!tbody) {
    console.error("Clients table body not found");
    return;
  }
  
  // Clear the current table
  tbody.innerHTML = '';
  
  // If no data, show a message
  if (data.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 11; // Span all columns (added Actions column)
    emptyCell.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>No clients found. Try refreshing or check server connection.</p>
        <button class="btn btn-sm btn-outline-primary" onclick="loadClientsFromServer()">
          <i class="fas fa-sync-alt me-1"></i> Refresh Clients
        </button>
      </div>
    `;
    emptyCell.className = 'text-center p-3';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }
  
  // Sort clients alphabetically by name
  data.sort((a, b) => {
    const nameA = (a["Client Name"] || "").toLowerCase();
    const nameB = (b["Client Name"] || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Helper function to safely handle cell content
  const safeValue = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };
  
  // Define the column order
  const columnOrder = [
    "Client Name",
    "Client Code",
    "Address",
    "City",
    "State",
    "ZIP",
    "Phone",
    "Email",
    "Contact Person",
    "Status"
  ];
  
  // Add clients to table
  data.forEach(client => {
    const row = document.createElement('tr');
    
    // Add a class for active/inactive clients
    if (client["Status"] !== "Active") {
      row.classList.add('table-secondary');
    }
    
    // Add action buttons cell
    const actionsTd = document.createElement('td');
    actionsTd.className = 'action-btn-container';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-primary client-action-btn';
    editBtn.innerHTML = '<i class="fas fa-edit me-1"></i> Edit';
    editBtn.addEventListener('click', () => openEditClientModal(client["Client Code"]));
    actionsTd.appendChild(editBtn);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger client-action-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete';
    deleteBtn.addEventListener('click', () => confirmDeleteClient(client["Client Code"]));
    actionsTd.appendChild(deleteBtn);
    
    row.appendChild(actionsTd);
    
    // Add cells in the defined order
    columnOrder.forEach(key => {
      const td = document.createElement('td');
      let value = client[key];
      
      // Special formatting for Status
      if (key === "Status") {
        if (value === "Active") {
          td.innerHTML = '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Active</span>';
        } else {
          td.innerHTML = '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i> Inactive</span>';
        }
      } 
      // Default formatting
      else {
        td.textContent = safeValue(value);
      }
      
      row.appendChild(td);
    });
    
    // Add row to table
    tbody.appendChild(row);
  });
  
  // Update client count
  showClientCount(data.length);
}

// Show the product count with enhanced styling
function showProductCount(count) {
  const productCount = document.getElementById('productCount');
  if (!productCount) return;
  
  const displayCount = count || 0;
  const activeCount = products.length;
  
  if (displayCount === 0) {
    productCount.innerHTML = '<i class="fas fa-box text-muted me-1"></i> No products loaded';
    return;
  }
  
  let countText = `<i class="fas fa-boxes text-primary me-1"></i> ${displayCount} products loaded`;
  
  if (count !== allProducts.length) {
    countText += ` <span class="text-muted">(filtered from ${allProducts.length} total)</span>`;
  } else if (activeCount !== displayCount) {
    countText += ` <span class="text-success">(${activeCount} active)</span>`;
  }
  
  productCount.innerHTML = countText;
}

// Show the client count with enhanced styling
function showClientCount(count) {
  const clientCount = document.getElementById('clientCount');
  if (!clientCount) return;
  
  const displayCount = count || 0;
  const activeCount = clients.length;
  
  if (displayCount === 0) {
    clientCount.innerHTML = '<i class="fas fa-user-slash text-muted me-1"></i> No clients loaded';
    return;
  }
  
  let countText = `<i class="fas fa-users text-primary me-1"></i> ${displayCount} clients loaded`;
  
  if (count !== allClients.length) {
    countText += ` <span class="text-muted">(filtered from ${allClients.length} total)</span>`;
  } else if (activeCount !== displayCount) {
    countText += ` <span class="text-success">(${activeCount} active)</span>`;
  }
  
  clientCount.innerHTML = countText;
}

// Open the add product modal
function openAddProductModal() {
  // Reset the form
  document.getElementById('productForm').reset();
  
  // Set mode to add
  document.getElementById('editProductMode').value = 'false';
  document.getElementById('originalProductCode').value = '';
  
  // Set title
  document.getElementById('productModalLabel').textContent = 'Add New Product';
  
  // Hide delete button
  document.getElementById('deleteProductBtn').style.display = 'none';
  
  // Show the modal
  const productModal = new bootstrap.Modal(document.getElementById('productModal'));
  productModal.show();
  
  // Focus on the first input
  setTimeout(() => {
    document.getElementById('productName').focus();
  }, 500);
}

// Open the add client modal
function openAddClientModal() {
  // Reset the form
  document.getElementById('clientForm').reset();
  
  // Set mode to add
  document.getElementById('editClientMode').value = 'false';
  document.getElementById('originalClientCode').value = '';
  
  // Set title
  document.getElementById('clientModalLabel').textContent = 'Add New Client';
  
  // Hide delete button
  document.getElementById('deleteClientBtn').style.display = 'none';
  
  // Show the modal
  const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
  clientModal.show();
  
  // Focus on the first input
  setTimeout(() => {
    document.getElementById('clientName').focus();
  }, 500);
}

// Open the edit product modal with enhanced UI
function openEditProductModal(productId) {
  // Find the product
  const product = allProducts.find(p => p["ID"] === productId);
  if (!product) {
    showNotification('Product not found', 'danger');
    return;
  }
  
  // Reset the form
  document.getElementById('productForm').reset();
  
  // Set mode to edit
  document.getElementById('editProductMode').value = 'true';
  document.getElementById('originalProductCode').value = product["Product Code"];
  document.getElementById('originalProductId').value = productId;
  
  // Set title with product info
  document.getElementById('productModalLabel').innerHTML = `
    Edit Product: <strong>${product["Product Name"]}</strong>
    ${product["Hazardous Material? (x if Yes)"] ? 
      '<span class="badge bg-warning text-dark ms-2"><i class="fas fa-exclamation-triangle me-1"></i> HAZMAT</span>' : ''}
  `;
  
  // Populate form fields
  document.getElementById('productName').value = product["Product Name"] || '';
  document.getElementById('productCode').value = product["Product Code"] || '';
  document.getElementById('productDescription').value = product["Product Description"] || '';
  document.getElementById('productGrade').value = product["Grade"] || '';
  document.getElementById('productUnitOfMeasure').value = product["U/M"] || '';
  document.getElementById('nmfcNumber').value = product["NMFC #"] || '';
  document.getElementById('freightClass').value = product["Freight Class"] || '';
  document.getElementById('packingGroup').value = product["Packing Group"] || '';
  document.getElementById('activeStatus').value = product["Active Status"] || 'Active';
  document.getElementById('netWeight').value = product["Net Weight (Per Package)"] || '';
  document.getElementById('grossWeight').value = product["Gross Weight (Per Package)"] || '';
  document.getElementById('productPrice').value = product["Price"] || '';
  document.getElementById('account').value = product["Account"] || '';
  document.getElementById('inventoryType').value = product["Inventory Type"] || 'NON-HAZMAT';
  document.getElementById('isHazardousMaterial').value = product["Hazardous Material? (x if Yes)"] || '';
  document.getElementById('hazmatClass').value = product["Hazmat Class"] || '';
  document.getElementById('nonHazmatClass').value = product["Non Hazmat Class"] || '';
  document.getElementById('stackable').value = product["Stackable?"] || 'No';
  
  // Show delete button
  document.getElementById('deleteProductBtn').style.display = 'block';
  
  // Show the modal
  const productModal = new bootstrap.Modal(document.getElementById('productModal'));
  productModal.show();
}

// Open the edit client modal with enhanced UI
function openEditClientModal(clientCode) {
  // Find the client
  const client = allClients.find(c => c["Client Code"] === clientCode);
  if (!client) {
    showNotification('Client not found', 'danger');
    return;
  }
  
  // Reset the form
  document.getElementById('clientForm').reset();
  
  // Set mode to edit
  document.getElementById('editClientMode').value = 'true';
  document.getElementById('originalClientCode').value = clientCode;
  
  // Set title with client info
  document.getElementById('clientModalLabel').innerHTML = `
    Edit Client: <strong>${client["Client Name"]}</strong>
    <span class="text-muted ms-2">${client["City"]}, ${client["State"]}</span>
    ${client["Status"] !== "Active" ? 
      '<span class="badge bg-secondary ms-2"><i class="fas fa-times-circle me-1"></i> Inactive</span>' : ''}
  `;
  
  // Populate form fields
  document.getElementById('clientName').value = client["Client Name"] || '';
  document.getElementById('clientCode').value = client["Client Code"] || '';
  document.getElementById('clientAddress').value = client["Address"] || '';
  document.getElementById('clientCity').value = client["City"] || '';
  document.getElementById('clientState').value = client["State"] || '';
  document.getElementById('clientZip').value = client["ZIP"] || '';
  document.getElementById('clientPhone').value = client["Phone"] || '';
  document.getElementById('clientEmail').value = client["Email"] || '';
  document.getElementById('clientContact').value = client["Contact Person"] || '';
  document.getElementById('clientStatus').value = client["Status"] || 'Active';
  
  // Show delete button
  document.getElementById('deleteClientBtn').style.display = 'block';
  
  // Show the modal
  const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
  clientModal.show();
}

// Save product (add new or update existing) with improved validation
function saveProduct() {
  // Get form values
  const originalProductId = document.getElementById('originalProductId').value;
  const form = document.getElementById('productForm');
  
  // Basic validation
  if (!form.checkValidity()) {
    // Trigger browser validation UI
    form.reportValidity();
    return;
  }
  
  // Show saving indicator
  showNotification('Saving product...', 'info');
  
  // Get edit mode and original product code
  const isEditMode = document.getElementById('editProductMode').value === 'true';
  const originalProductCode = document.getElementById('originalProductCode').value;
  
// Create the product object
const product = { 
  "Product Name": document.getElementById('productName').value,
  "Product Code": document.getElementById('productCode').value,
  "Product Description": document.getElementById('productDescription').value,
  "Grade": document.getElementById('productGrade').value,
  "U/M": document.getElementById('productUnitOfMeasure').value,
  "NMFC #": document.getElementById('nmfcNumber').value,
  "Freight Class": document.getElementById('freightClass').value,
  "Packing Group": document.getElementById('packingGroup').value,
  "Active Status": document.getElementById('activeStatus').value,
  "Net Weight (Per Package)": document.getElementById('netWeight').value,
  "Gross Weight (Per Package)": document.getElementById('grossWeight').value,
  "Price": document.getElementById('productPrice').value,
  "Account": document.getElementById('account').value,
  "Inventory Type": document.getElementById('inventoryType').value,
  "Hazardous Material? (x if Yes)": document.getElementById('isHazardousMaterial').value,
  "Hazmat Class": document.getElementById('hazmatClass').value,
  "Non Hazmat Class": document.getElementById('nonHazmatClass').value,
  "Stackable?": document.getElementById('stackable').value
};

// Handle edit mode - preserve the original database ID
if (isEditMode && originalProductId) {
  product["ID"] = originalProductId; // Keep the original database ID
  
  // Update the product in the local array
  const productIndex = allProducts.findIndex(p => p["ID"] === originalProductId);
  if (productIndex !== -1) {
    allProducts[productIndex] = product;
  } else {
    // If not found, add it (shouldn't happen in edit mode)
    allProducts.push(product);
  }
} else {
  // For new products, DON'T set an ID - let the server assign one
  delete product["ID"];
  
  // Check if product code already exists for new products
  const productCodeExists = allProducts.some(p => p["Product Code"] === product["Product Code"]);
  if (productCodeExists) {
    showNotification('Product code already exists', 'danger');
    return;
  }
  
  // Add to local array (will get proper ID from server response)
  allProducts.push(product);
}
  
// Save to server
saveInventoryToServer(allProducts).then(() => {
  // Reload the inventory from server to get proper IDs
  return loadInventoryFromServer();  // <-- ADD THE FUNCTION NAME
}).then(() => {
	
  // Update active products list
  products = allProducts.filter(p => p["Active Status"] === "Active");
  
  // Re-render table
  filterInventoryTable();
  
  // Hide the modal
  const modalElement = document.getElementById('productModal');
  const productModal = bootstrap.Modal.getInstance(modalElement);
  productModal.hide();
  
  showNotification(`Product ${isEditMode ? 'updated' : 'added'} successfully`, 'success');
}).catch(error => {
  console.error('Error saving product:', error);
  showNotification('Error saving product: ' + error.message, 'danger');
});

// Save client (add new or update existing) with improved validation
function saveClient() {
  // Get form values
  const form = document.getElementById('clientForm');
  
  // Basic validation
  if (!form.checkValidity()) {
    // Trigger browser validation UI
    form.reportValidity();
    return;
  }
  
  // Show saving indicator
  showNotification('Saving client...', 'info');
  
  // Get edit mode and original client code
  const isEditMode = document.getElementById('editClientMode').value === 'true';
  const originalClientCode = document.getElementById('originalClientCode').value;
  
  // Create the client object
  const client = {
    "Client Name": document.getElementById('clientName').value,
    "Client Code": document.getElementById('clientCode').value,
    "Address": document.getElementById('clientAddress').value,
    "City": document.getElementById('clientCity').value,
    "State": document.getElementById('clientState').value,
    "ZIP": document.getElementById('clientZip').value,
    "Phone": document.getElementById('clientPhone').value,
    "Email": document.getElementById('clientEmail').value,
    "Contact Person": document.getElementById('clientContact').value,
    "Status": document.getElementById('clientStatus').value
  };
  
  // Handle edit mode logic
  if (isEditMode) {
    // Check if client code has changed
    if (originalClientCode !== client["Client Code"]) {
      // This is a more complex update, need to delete old one first
      const clientCodeExists = allClients.some(c => c["Client Code"] === client["Client Code"] && c["Client Code"] !== originalClientCode);
      if (clientCodeExists) {
        showNotification('Client code already exists', 'danger');
        return;
      }
      
      // Remove the old client
      const oldClientIndex = allClients.findIndex(c => c["Client Code"] === originalClientCode);
      if (oldClientIndex !== -1) {
        allClients.splice(oldClientIndex, 1);
      }
    } else {
      // Simple update, remove the existing client first
      const clientIndex = allClients.findIndex(c => c["Client Code"] === client["Client Code"]);
      if (clientIndex !== -1) {
        allClients.splice(clientIndex, 1);
      }
    }
  } else {
    // Check if client code already exists for new clients
    const clientCodeExists = allClients.some(c => c["Client Code"] === client["Client Code"]);
    if (clientCodeExists) {
      showNotification('Client code already exists', 'danger');
      return;
    }
  }
  
  // Add the client to the array
  allClients.push(client);
  
  // Save to server
  saveClientsToServer(allClients).then(() => {
    // Update active clients list
    clients = allClients.filter(c => c["Status"] === "Active");
    
    // Re-render table
    filterClientsTable();
    
    // Update the client dropdown in case clients changed
    populateClientDropdown();
    
    // Hide the modal
    const modalElement = document.getElementById('clientModal');
    const clientModal = bootstrap.Modal.getInstance(modalElement);
    clientModal.hide();
    
    showNotification(`Client ${isEditMode ? 'updated' : 'added'} successfully`, 'success');
  }).catch(error => {
    showNotification('Error saving client: ' + error.message, 'danger');
  });
}

// Confirm delete product with improved UI
function confirmDeleteProduct(productId) {  // Changed parameter name
  // If called from the delete button in the edit modal
  if (!productId) {  // Changed variable name
    productId = document.getElementById('originalProductId').value;  // Changed to get ID instead of code
  }
  
  // Find the product
  const product = allProducts.find(p => p["ID"] === productId);  // Changed to find by ID
  if (!product) {
    showNotification('Product not found', 'danger');
    return;
  }
  
  // Setup confirmation modal
  document.getElementById('confirmationTitle').textContent = 'Delete Product';
  document.getElementById('confirmationMessage').innerHTML = `
    <div class="text-center mb-3">
      <i class="fas fa-trash-alt text-danger" style="font-size: 3rem;"></i>
    </div>
    <p>Are you sure you want to delete <strong>${product["Product Name"]}</strong> (${product["Product Code"]})?</p>
    <p class="text-danger"><strong>Warning:</strong> This action cannot be undone.</p>
  `;
  
  // Store the product code as a data attribute on the confirm button
  document.getElementById('confirmActionBtn').dataset.action = 'deleteProduct';
  document.getElementById('confirmActionBtn').dataset.productId = productId;
  document.getElementById('confirmActionBtn').className = 'btn btn-danger';
  document.getElementById('confirmActionBtn').innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete Product';
  
  // Hide the product modal if it's open
  const productModalElement = document.getElementById('productModal');
  const productModal = bootstrap.Modal.getInstance(productModalElement);
  if (productModal) {
    productModal.hide();
  }
  
  // Show the confirmation modal
  const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
  confirmationModal.show();
}

// Confirm delete client with improved UI
function confirmDeleteClient(clientCode) {
  // If called from the delete button in the edit modal
  if (!clientCode) {
    clientCode = document.getElementById('originalClientCode').value;
  }
  
  // Find the client
  const client = allClients.find(c => c["Client Code"] === clientCode);
  if (!client) {
    showNotification('Client not found', 'danger');
    return;
  }
  
  // Setup confirmation modal
  document.getElementById('confirmationTitle').textContent = 'Delete Client';
  document.getElementById('confirmationMessage').innerHTML = `
    <div class="text-center mb-3">
      <i class="fas fa-trash-alt text-danger" style="font-size: 3rem;"></i>
    </div>
    <p>Are you sure you want to delete <strong>${client["Client Name"]}</strong> (${client["Client Code"]})?</p>
    <p class="text-danger"><strong>Warning:</strong> This action cannot be undone.</p>
  `;
  
  // Store the client code as a data attribute on the confirm button
  document.getElementById('confirmActionBtn').dataset.action = 'deleteClient';
  document.getElementById('confirmActionBtn').dataset.clientCode = clientCode;
  document.getElementById('confirmActionBtn').className = 'btn btn-danger';
  document.getElementById('confirmActionBtn').innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete Client';
  
  // Hide the client modal if it's open
  const clientModalElement = document.getElementById('clientModal');
  const clientModal = bootstrap.Modal.getInstance(clientModalElement);
  if (clientModal) {
    clientModal.hide();
  }
  
  // Show the confirmation modal
  const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
  confirmationModal.show();
}

// Execute the confirmed action
function executeConfirmedAction() {
  const confirmBtn = document.getElementById('confirmActionBtn');
  const action = confirmBtn.dataset.action;
  
  if (action === 'deleteProduct') {
    const productId = confirmBtn.dataset.productId;
    deleteProduct(productId);
  } else if (action === 'deleteClient') {
    const clientCode = confirmBtn.dataset.clientCode;
    deleteClient(clientCode);
  } else if (action === 'clearAllItems') {
    // Clear the bolItems array
    bolItems = [];
    
    // Update the UI
    updateItemsList();
    
    showNotification('All items have been cleared', 'success');
  }
  
  // Hide the confirmation modal
  const modalElement = document.getElementById('confirmationModal');
  const confirmationModal = bootstrap.Modal.getInstance(modalElement);
  confirmationModal.hide();
}

// Delete product with improved feedback
function deleteProduct(productId) {
  // Find the product
  const productIndex = allProducts.findIndex(p => p["ID"] === productId);
  if (productIndex === -1) {
    showNotification('Product not found', 'danger');
    return;
  }
  
  // Get product name for the notification
  const productName = allProducts[productIndex]["Product Name"];
  
  // Show deleting indicator
  showNotification(`Deleting product: ${productName}...`, 'info');
  
  // Remove from array
  allProducts.splice(productIndex, 1);
  
  // Save to server
  saveInventoryToServer(allProducts).then(() => {
    // Update active products list
    products = allProducts.filter(p => p["Active Status"] === "Active");
    
    // Re-render table
    filterInventoryTable();
    
    showNotification(`Product "${productName}" deleted successfully`, 'success');
  }).catch(error => {
    showNotification('Error deleting product: ' + error.message, 'danger');
  });
}

// Delete client with improved feedback
function deleteClient(clientCode) {
  // Find the client
  const clientIndex = allClients.findIndex(c => c["Client Code"] === clientCode);
  if (clientIndex === -1) {
    showNotification('Client not found', 'danger');
    return;
  }
  
  // Get client name for the notification
  const clientName = allClients[clientIndex]["Client Name"];
  
  // Show deleting indicator
  showNotification(`Deleting client: ${clientName}...`, 'info');
  
  // Remove from array
  allClients.splice(clientIndex, 1);
  
  // Save to server
  saveClientsToServer(allClients).then(() => {
    // Update active clients list
    clients = allClients.filter(c => c["Status"] === "Active");
    
    // Re-render table
    filterClientsTable();
    
    // Update the client dropdown in case client was used there
    populateClientDropdown();
    
    showNotification(`Client "${clientName}" deleted successfully`, 'success');
  }).catch(error => {
    showNotification('Error deleting client: ' + error.message, 'danger');
  });
}

// Save inventory to server with improved error handling
function saveInventoryToServer(products) {
  return fetch('/api/inventory/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Save response:', data);
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    return data;
  })
  .catch(error => {
    console.error('Error saving to server:', error);
    
    // Try to save locally if server fails
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem(`inventory_backup_${timestamp}`, JSON.stringify(products));
      console.log('Saved backup to localStorage');
    } catch (e) {
      console.error('Could not save backup to localStorage:', e);
    }
    
    throw error;
  });
}

// Save clients to server with improved error handling
function saveClientsToServer(clients) {
  return fetch('/api/clients/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clients }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Save response:', data);
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    return data;
  })
  .catch(error => {
    console.error('Error saving to server:', error);
    
    // Try to save locally if server fails
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem(`clients_backup_${timestamp}`, JSON.stringify(clients));
      console.log('Saved backup to localStorage');
    } catch (e) {
      console.error('Could not save backup to localStorage:', e);
    }
    
    throw error;
  });
}

// Add a PO number
function addPoNumber() {
  const poInput = document.getElementById('poNumberInput');
  if (!poInput) return;
  
  const poNumber = poInput.value.trim();
  
  if (poNumber) {
    poNumbers.push(poNumber);
    poInput.value = '';
    updatePoNumbersList();
    showNotification(`PO Number ${poNumber} added`, 'success');
  }
}

// Updated PO number display with modern badges
function updatePoNumbersList() {
  const poList = document.getElementById('poNumbersList');
  if (!poList) return;
  
  poList.innerHTML = '';
  
  poNumbers.forEach((po, index) => {
    const poElement = document.createElement('div');
    poElement.className = 'badge bg-primary d-flex align-items-center me-2 mb-2';
    poElement.style.borderRadius = '6px';
    poElement.style.padding = '8px 12px';
    poElement.innerHTML = `
      <i class="fas fa-hashtag me-1"></i>
      <span>${po}</span>
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Remove" 
        onclick="removePoNumber(${index})" style="font-size: 0.7rem;"></button>
    `;
    poList.appendChild(poElement);
  });
}

// Remove a PO number
function removePoNumber(index) {
  const removedPo = poNumbers[index];
  poNumbers.splice(index, 1);
  updatePoNumbersList();
  showNotification(`PO Number ${removedPo} removed`, 'info');
}

// Enhanced add item functions with better visual feedback
function addBolItem() {
  // Check if there's at least one pallet
  const hasPallet = bolItems.some(item => item.isPallet);
  
  if (!hasPallet) {
    showNotification('Please add a pallet first before adding items', 'warning');
    
    // Highlight the pallet button to guide the user
    const palletBtn = document.getElementById('addPalletBtn');
    if (palletBtn) {
      palletBtn.classList.add('btn-pulse');
      setTimeout(() => {
        palletBtn.classList.remove('btn-pulse');
      }, 2000);
    }
    return;
  }
  
  const newItem = {
    id: Date.now(),
    productId: '',
    quantity: '',
    packaging: ''
  };
  
  // Add with animation
  bolItems.push(newItem);
  
  // Add a temporary class to the items list to indicate a new item was added
  const itemsList = document.getElementById('itemsList');
  if (itemsList) {
    itemsList.classList.add('items-updated');
    setTimeout(() => {
      itemsList.classList.remove('items-updated');
    }, 500);
  }
  
  updateItemsList();
  
  // Show a small notification
  showNotification('Item added successfully', 'success');
}

// Enhanced add pallet function
function addPallet() {
  const newPallet = {
    id: Date.now(),
    isPallet: true,
    dimensions: '42x42x32',
    quantity: 1
  };
  
  // Add with animation
  bolItems.push(newPallet);
  
  // Add a temporary class to the items list to indicate a new item was added
  const itemsList = document.getElementById('itemsList');
  if (itemsList) {
    itemsList.classList.add('items-updated');
    setTimeout(() => {
      itemsList.classList.remove('items-updated');
    }, 500);
  }
  
  updateItemsList();
  
  // Show a small notification
  showNotification('Pallet added successfully', 'success');
}

// Update the items list in the UI - modern styling for items
function updateItemsList() {
  const itemsList = document.getElementById('itemsList');
  const noItemsMsg = document.getElementById('noItemsMsg');
  const totalWeightDiv = document.getElementById('totalWeightDiv');
  
  if (!itemsList || !noItemsMsg || !totalWeightDiv) {
    console.error("Required DOM elements not found");
    return;
  }
  
  // Clear the current list
  itemsList.innerHTML = '';
  
  // Show/hide elements based on items count
  if (bolItems.length === 0) {
    noItemsMsg.style.display = 'block';
    totalWeightDiv.style.display = 'none';
  } else {
    noItemsMsg.style.display = 'none';
    totalWeightDiv.style.display = 'block';
    
    // Add items to the list
    bolItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'card mb-3 item-card ' + (item.isPallet ? 'pallet-card' : '');
      
      if (item.isPallet) {
        // Modern pallet item with dimensions and count, no weight field
        itemElement.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center flex-wrap">
              <div class="d-flex align-items-center mb-2 me-3">
                <span class="me-2"><i class="fas fa-pallet text-primary me-1"></i> Pallet Dimensions:</span>
                <div class="input-group" style="width: 130px;">
                  <input type="text" class="form-control form-control-sm" style="border-radius: 6px 0 0 6px;"
                    value="${item.dimensions}" onchange="updateItem(${item.id}, 'dimensions', this.value)">
                  <span class="input-group-text" style="border-radius: 0 6px 6px 0;">"H</span>
                </div>
              </div>
              <div class="d-flex align-items-center mb-2 me-3">
                <span class="me-2"><i class="fas fa-hashtag text-primary me-1"></i> # of Pallets:</span>
                <input type="number" class="form-control form-control-sm" style="width: 70px;" min="1"
                  value="${item.quantity || 1}" onchange="updateItem(${item.id}, 'quantity', Number(this.value))">
              </div>
              <button class="btn btn-sm btn-danger mb-2" onclick="removeItem(${item.id})">
                <i class="fas fa-trash-alt me-1"></i> Remove
              </button>
            </div>
          </div>
        `;
      } else {
        // Modern product item
        let product = null;
        
        if (item.productId) {
          product = products.find(p => p["ID"] === item.productId);
        }
        
        const isHazmat = product && product["Hazardous Material? (x if Yes)"];
        
        itemElement.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center flex-wrap">
              <div class="mb-2 me-3">
                <label class="me-2"><i class="fas fa-flask text-primary me-1"></i> Product:</label>
                <select class="form-select form-select-sm" style="min-width: 250px; display: inline-block;"
                 onchange="updateItem(${item.id}, 'productId', this.value)" required>
                 <option value="" selected>Select a product...</option>
                 ${products.map(p => {
                  const isSelected = item.productId === p["ID"];
                  return `
                    <option value="${p["ID"]}" ${isSelected ? 'selected' : ''}>
                     ${p["Product Name"]} (${p["Product Code"]})
                    </option>
                  `;
                }).join('')}
              </select>
              </div>
              <div class="d-flex align-items-center mb-2 me-3">
                <label class="me-2"><i class="fas fa-boxes text-primary me-1"></i> Quantity:</label>
                <input type="number" class="form-control form-control-sm" min="1" style="width: 70px;"
                  value="${item.quantity}" placeholder="Qty" onchange="updateItem(${item.id}, 'quantity', Number(this.value))" required>
              </div>
              <button class="btn btn-sm btn-danger mb-2" onclick="removeItem(${item.id})">
                <i class="fas fa-trash-alt me-1"></i> Remove
              </button>
            </div>
            
            ${product ? `
              <div class="mt-2 p-2 rounded small ${isHazmat ? 'bg-warning bg-opacity-10' : 'bg-light'}">
                <div class="row">
                  <div class="col-md-3">
                    <strong><i class="fas fa-barcode text-primary me-1"></i> UN:</strong> ${product["Product Code"]}
                  </div>
                  <div class="col-md-3">
                    <strong><i class="fas fa-exclamation-triangle ${isHazmat ? 'text-warning' : 'text-muted'} me-1"></i> Hazmat:</strong> 
                    ${isHazmat ? '<span class="text-warning fw-bold">Yes</span>' : 'No'}
                  </div>
                  <div class="col-md-3">
                    <strong><i class="fas fa-biohazard ${isHazmat ? 'text-warning' : 'text-muted'} me-1"></i> Class:</strong> 
                    ${product["Hazmat Class"] || 'N/A'}
                  </div>
                  <div class="col-md-3">
                    <strong><i class="fas fa-weight text-primary me-1"></i> Weight:</strong> 
                    ${(item.quantity * (product["Gross Weight (Per Package)"] || 0)).toFixed(2)}lbs total
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }
      
      itemsList.appendChild(itemElement);
    });
  }
  
  // Calculate and update total weight
  calculateTotalWeight();
}

// Update an item property
function updateItem(id, property, value) {
  const itemIndex = bolItems.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    bolItems[itemIndex][property] = value;
    
    // If updating the productId
    if (property === 'productId' && value) {
      const product = products.find(p => p["ID"] === value);
      
      if (product) {
        bolItems[itemIndex]['productId'] = value;
        bolItems[itemIndex]['productName'] = product["Product Name"];
        
        if (!bolItems[itemIndex]['packaging'] || bolItems[itemIndex]['packaging'] === '') {
          bolItems[itemIndex]['packaging'] = product["U/M"] || 'Case';
        }
        
        showNotification(`Selected ${product["Product Name"]}`, 'success');
      }
    }
    
    updateItemsList();  // This should be here - outside the productId check
  }
}

// Remove an item
function removeItem(id) {
  // Find the item to show what was removed
  const item = bolItems.find(item => item.id === id);
  let itemDesc = item.isPallet ? 'Pallet' : 'Item';
  
  if (!item.isPallet && item.productName) {
    itemDesc = item.productName;
  }
  
  // Remove the item
  bolItems = bolItems.filter(item => item.id !== id);
  updateItemsList();
  
  // Show a notification
  showNotification(`${itemDesc} removed`, 'info');
}

// Calculate total weight - include ONLY product weights, exclude pallets
function calculateTotalWeight() {
  totalWeight = 0;
  
  bolItems.forEach(item => {
    if (!item.isPallet) {
      // Only process non-pallet items
      
      // Find the product using uniqueProductId, or fallback to productId and productName
      let product = null;
      
      if (item.productId) {
        product = products.find(p => p["ID"] === item.productId);
      } 
      
      // Add product weight
      if (product && !isNaN(item.quantity) && item.quantity > 0) {
        totalWeight += (product["Gross Weight (Per Package)"] || 0) * item.quantity;
      }
    }
    // Skip pallets completely - don't add their weight to the total
  });
  
  const totalWeightElement = document.getElementById('totalWeight');
  if (totalWeightElement) {
    totalWeightElement.textContent = totalWeight.toFixed(2);
  }
}

// Generate and save the BOL document with modern styling
function generateDocument() {
  console.log("generateDocument function called");
  
  if (bolItems.length === 0) {
    showNotification('Please add at least one item to the Bill of Lading', 'warning');
    return;
  }
  
  // Show loading indicator
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating...';
    generateBtn.disabled = true;
  }
  
  // Get all field values
  const shipDateInput = document.getElementById('shipDate').value || new Date().toISOString().slice(0, 10);
  const shipDateObj = new Date(shipDateInput);
  const month = String(shipDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(shipDateObj.getDate()).padStart(2, '0');
  const shipDate = month + '-' + day + '-' + shipDateObj.getFullYear();
  const carrier = document.getElementById('carrier').value || 'World Wide Express 3rd Party';
  
  const toName = document.getElementById('toName').value || 'AquaPhoenix Scientific';
  const toAddress = document.getElementById('toAddress').value || '860 Gitts Run Road';
  const toCity = document.getElementById('toCity').value || 'Hanover';
  const toState = document.getElementById('toState').value || 'PA';
  const toZip = document.getElementById('toZip').value || '17331';
  
  const fromName = document.getElementById('fromName').value || 'Corco Chemical Corporation';
  const fromAddress = document.getElementById('fromAddress').value || '299 Cedar Lane';
  const fromCity = document.getElementById('fromCity').value || 'Fairless Hills';
  const fromState = document.getElementById('fromState').value || 'PA';
  const fromZip = document.getElementById('fromZip').value || '19030';
  const fromPhone = document.getElementById('fromPhone').value || '215-295-5006';
  
  const thirdPartyName = document.getElementById('thirdPartyName').value || 'Worldwide Express';
  const thirdPartyAddress = document.getElementById('thirdPartyAddress').value || '2323 Victory Avenue Ste 1600';
  const thirdPartyCity = document.getElementById('thirdPartyCity').value || 'Dallas';
  const thirdPartyState = document.getElementById('thirdPartyState').value || 'TX';
  const thirdPartyZip = document.getElementById('thirdPartyZip').value || '75219';
  
  const freightCharges = document.getElementById('freightCharges').value || 'Collect';
  const placardsSupplied = document.getElementById('placardsSupplied').value || 'NO';
  
  // Create the HTML document with portrait orientation, border, proper margins, and modern styling
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill of Lading - ${toName} - ${shipDate}</title>
      <style>
        @page {
          size: portrait;
          margin: 0.5in;
          margin-bottom: 0;
        }
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          font-size: 12px;
          border: 1px solid #003b71;
          padding: 10px;
          box-sizing: border-box;
          color: #333;
        }
        .document-container {
          padding: 15px;
        }
        .header { 
          text-align: center; 
          font-weight: bold; 
          font-size: 18px; 
          margin-bottom: 15px; 
          color: #003b71;
          border-bottom: 2px solid #003b71;
          padding-bottom: 10px;
        }
        .info-container { 
          margin-bottom: 15px; 
          display: flex;
          flex-wrap: wrap; 
        }
        .info-col { 
          flex: 1; 
          min-width: 250px;
          margin-bottom: 10px;
          padding: 0 10px;
        }
        .info-item { 
          margin-bottom: 8px; 
        }
        .label { 
          font-weight: bold; 
          color: #003b71;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
          font-size: 10px;
        }
        th, td { 
          border: 1px solid #003b71; 
          padding: 4px; 
          text-align: left; 
        }
        th { 
          background-color: #e6f4ff; 
          color: #003b71;
          font-size: 9px;
          font-weight: bold;
        }
        .divider { 
          border-top: 1px solid #003b71; 
          margin: 15px 0; 
          width: 100%; 
        }
        .signatures { 
          display: flex; 
          margin-top: 20px; 
          flex-wrap: wrap;
        }
        .signature-col { 
          flex: 1; 
          min-width: 250px;
          margin-bottom: 15px;
        }
        .signature-line { 
          border-top: 1px solid #003b71; 
          margin-top: 20px; 
          width: 80%; 
        }
        .footer { 
          margin-top: 15px; 
          font-size: 11px; 
          text-align: center; 
          font-weight: bold; 
          color: #dc3545;
        }
        .note-section { 
          display: flex; 
          margin-top: 15px; 
          font-size: 11px; 
          flex-wrap: wrap;
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
        }
        .note-col { 
          flex: 1; 
          padding: 5px; 
          min-width: 250px;
        }
        .underline { 
          text-decoration: underline; 
        }
        .highlight {
          background-color: #fffacd;
          padding: 2px 4px;
          border-radius: 2px;
        }
        .hazmat-cell {
          background-color: #fff3cd;
        }
        .corco-blue {
          color: #003b71;
        }
        .warning-text {
          color: #dc3545;
          font-weight: bold;
        }
        .total-row {
          background-color: #e6f4ff;
          font-weight: bold;
        }
        @media print {
  body { 
    margin: 0; 
    border: 1px solid #003b71;
  }
  button, .print-button { 
    display: none !important; 
  }
  /* Set up print colors */
  html {
    -webkit-print-color-adjust: exact;
  }
  /* Configure page settings */
  @page {
    size: portrait;
    margin-bottom: 0.3in;
    /* Format the page number at the bottom */
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Arial', sans-serif;
      font-size: 9pt;
    }
  }
}
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="header">STRAIGHT BILL OF LADING</div>
        
        <div class="info-container">
          <div class="info-col">
            <div class="info-item">
              <span class="label">Date:<br></span> ${shipDate}
            </div>
            
            <div class="info-item">
              <div class="label">TO:</div>
              <div>${toName}</div>
              <div>${toAddress}</div>
              <div>${toCity} ${toState} ${toZip}</div>
            </div>
            
            <div class="info-item">
              <div class="label">3rd Party freight charges to:</div>
              <div>${thirdPartyName}</div>
              <div>${thirdPartyAddress}</div>
              <div>${thirdPartyCity} ${thirdPartyState} ${thirdPartyZip}</div>
            </div>
          </div>
          
          <div class="info-col" style="flex: 1; text-align: right;">
            <div class="info-item">
              <span class="label">Carrier:<br></span> ${carrier}
            </div>
            
            <div class="info-item">
              <div class="label">FROM:</div>
              <div>${fromName}</div>
              <div>${fromAddress}</div>
              <div>${fromCity} ${fromState} ${fromZip}</div>
              <div>Telephone ${fromPhone}</div>
            </div>
            
            <div class="info-item">
              <div><span class="label">Freight Charges:<br></span> ${freightCharges}</div>
              <div><span class="label">Placards Supplied?<br></span> <span class="underline">${placardsSupplied}</span></div>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th colspan="2" style="text-align: center;">Handling Unit</th>
              <th colspan="2" style="text-align: center;">Package</th>
              <th colspan="8" style="text-align: center;"></th>
            </tr>
            <tr>
              <th>Type</th>
              <th>Qty</th>
              <th>Type</th>
              <th>Qty</th>
              <th>HM</th>
              <th>Commodity Description</th>
              <th style="text-align: center;">Weight (lbs)</th>
              <th style="text-align: center;">Freight Class</th>
              <th style="text-align: center;">NMFC#</th>
              <th style="text-align: center;">Pallet Dimensions LxWxH</th>
              <th>Stackable?</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  // Initialize counters for totals
  let totalHandlingUnits = 0;
  let totalPackages = 0;
  
  // Process the items in pairs (pallet + item)
  let i = 0;
  while (i < bolItems.length) {
    const currentItem = bolItems[i];
    
    // If this is a pallet, check if the next item is a product
    if (currentItem.isPallet) {
      const palletQuantity = currentItem.quantity || 1;
      totalHandlingUnits += palletQuantity; // Count pallet as handling unit
      
      const nextItemIndex = i + 1;
      const nextItem = nextItemIndex < bolItems.length ? bolItems[nextItemIndex] : null;
      
      // If next item exists and is not a pallet, combine them
      if (nextItem && !nextItem.isPallet) {
        
        // Find the product details
        let product = null;
        
        if (nextItem.productId) {
          product = products.find(p => p["ID"] === nextItem.productId);
        }
        
        if (product) {
          // Add package quantity to total
          totalPackages += nextItem.quantity || 0;
          
          // Calculate weights
          const netWeight = (product["Net Weight (Per Package)"] || 0) * nextItem.quantity;
          const grossWeight = (product["Gross Weight (Per Package)"] || 0) * nextItem.quantity;
          
          // Determine if hazmat
          const isHazmat = product["Hazardous Material? (x if Yes)"];
          
          // Display pallet and the product on the same line
          html += `
            <tr${isHazmat ? ' class="hazmat-cell"' : ''}>
              <td>Pallet</td>
              <td>${palletQuantity}</td>
              <td>${nextItem.packaging || product["U/M"] || 'Case'}</td>
              <td>${nextItem.quantity}</td>
              <td>${isHazmat ? '<span class="highlight">X</span>' : ""}</td>
              <td>${product["Product Code"] || ""}, <strong>${product["Product Name"] || ""}</strong>${isHazmat ? ', <span class="highlight"> ' + (product["Hazmat Class"] || "N/A") + '</span>' : ''}, PG: ${product["Packing Group"] || "N/A"}, ${netWeight.toFixed(2)} lbs Net</td>
              <td>${grossWeight.toFixed(2)} lbs</td>
              <td>${product["Freight Class"] || ""}</td>
              <td>${product["NMFC #"] || ""}</td>
              <td>${currentItem.dimensions || '48x40x30'}</td>
              <td>${product["Stackable?"] || "No"}</td>
            </tr>
          `;
          
          // Skip the next item since we've already processed it
          i += 2;
        } else {
          // Product not found, show just the pallet
          html += `
            <tr>
              <td>Pallet</td>
              <td>${palletQuantity}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>${currentItem.dimensions || '48x40x30'}</td>
              <td></td>
            </tr>
          `;
          i++;
        }
      } else {
        // Just a pallet with no product after it
        html += `
          <tr>
            <td>Pallet</td>
            <td>${palletQuantity}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${currentItem.dimensions || '48x40x30'}</td>
            <td></td>
          </tr>
        `;
        i++;
      }
    } else {
      // This is a product item not associated with a pallet
      let product = null;
      
      if (currentItem.productId) {
        product = products.find(p => p["ID"] === currentItem.productId);
      }
      
      if (product) {
        // Add package quantity to total
        totalPackages += currentItem.quantity || 0;
        
        const netWeight = (product["Net Weight (Per Package)"] || 0) * currentItem.quantity;
        const grossWeight = (product["Gross Weight (Per Package)"] || 0) * currentItem.quantity;
        const isHazmat = product["Hazardous Material? (x if Yes)"];
        
        html += `
          <tr${isHazmat ? ' class="hazmat-cell"' : ''}>
            <td></td>
            <td></td>
            <td>${currentItem.packaging || product["U/M"] || 'Case'}</td>
            <td>${currentItem.quantity}</td>
            <td>${isHazmat ? '<span class="highlight">X</span>' : ""}</td>
            <td>${product["Product Code"] || ""}, <strong>${product["Product Name"] || ""}</strong>${isHazmat ? ', <span class="highlight"> ' + (product["Hazmat Class"] || "N/A") + '</span>' : ''}, PG: ${product["Packing Group"] || "N/A"}, ${netWeight.toFixed(2)} lbs Net</td>
            <td>${grossWeight.toFixed(2)} lbs</td>
            <td>${product["Freight Class"] || ""}</td>
            <td>${product["NMFC #"] || ""}</td>
            <td></td>
            <td>${product["Stackable?"] || "No"}</td>
          </tr>
        `;
      }
      i++;
    }
  }
  
  // Add totals row for handling units and packages
  html += `
    <tr class="total-row">
      <td style="text-align: center;"><strong>Total H/U:</strong></td>
      <td><strong>${totalHandlingUnits}</strong></td>
      <td style="text-align: center;"><strong>Total Packages:</strong></td>
      <td colspan="2"><strong>${totalPackages}</strong></td>
      <td style="text-align: right;"><strong>Total Shipment Weight:</strong></td>
      <td colspan="5" style="font-weight: bold; background-color: #e6f4ff;"><strong class="corco-blue">${totalWeight.toFixed(2)} lbs</strong></td>
    </tr>
  `;
  
  // Add PO numbers
  if (poNumbers.length > 0) {
    html += `
      <tr>
        <td colspan="11" style="font-weight: bold; background-color: #e6f4ff;">PO# ${poNumbers.join(", ")}</td>
      </tr>
    `;
  }
  
  // Add total weight
  html += `
      <tr>
      </tr>
    </tbody>
  </table>
    
  <div class="note-section">
    <div class="note-col">
      <p>
        <strong class="corco-blue">NOTE:</strong> Liability limitation for loss or damage in this shipment <br> 
        may be applicable. <span class="underline">See 49 U.S.C. B14706 (c)(1)(A) and (B)</span><br>
        This is to certify that above-named materials are properly classified, described,
        packaged, marked and labeled, and <br> are in proper condition for transportation
        according to the applicable regulations of the Department of Transportation.
      </p>
    </div>
    <div class="note-col">
      <p>
        Carrier acknowledges receipt of packages and required placards.<br>
        Carrier certifies emergency response information was made
        available and/or carrier has DOT emergency response
        guidebook or equivalent documentation in vehicle. Property
        described above is received in good order, except as noted.<br>
        <strong class="warning-text">Per: *Driver must sign and put Pro# on one copy and return it to us*</strong>
      </p>
    </div>
  </div>
  
  <div class="signatures">
    <div class="signature-col">
      <div>Shipper: <span class="underline"><strong>${fromName}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
      <div>Per:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="underline">Gina M. Rambo &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date: <span class="underline">${shipDate}</span></div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="underline" style="font-family: 'Brush Script MT', cursive; font-size: 16px;">Gina M. Rambo</span></div>
    </div>
    <div class="signature-col">
      <div>Carrier: <span class="underline">_______________________________________</span></div>
      <div><span class="underline">______________________________________________</span></div>
    </div>
  </div>
  
  <div class="footer">
	<strong class="warning-text">Emergency Response: Chem Trec 800-424-9300 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; U.S. DOT Hazmat Reg. No. 091216 554 069YZ</strong>
  </div>
  
  </div>
  
<button onclick="window.print()" class="print-button" style="margin-top: 20px; padding: 12px 20px; background-color: #003b71; color: white; border: none; cursor: pointer; border-radius: 6px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0, 59, 113, 0.2);">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-printer" viewBox="0 0 16 16" style="margin-right: 8px;">
    <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
    <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
  </svg>
  Print Bill of Lading
</button>
  </body>
  </html>`;
  
  // Try to save using the server API if available
  try {
    // Create a filename with date
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `BOL_${date}_${Math.floor(Math.random() * 1000)}.html`;
    
    console.log("Attempting to save BOL via API...");
    
    // Check if server API is available
    fetch('/api/save-bol', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: html,
        filename
      }),
    })
    .then(response => {
      console.log("API response received:", response);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(result => {
      console.log("API result:", result);
      if (result.success) {
        showNotification(`Bill of Lading saved as ${filename}`, 'success');
        
        // Also open the file in a new tab
        openHtmlInNewTab(html);
        
        // Reset the generate button
        if (generateBtn) {
          generateBtn.innerHTML = '<i class="fas fa-file-export me-2"></i> Generate Bill of Lading';
          generateBtn.disabled = false;
        }
      } else {
        throw new Error("API returned success: false");
      }
    })
    .catch(error => {
      console.log('Server API error or not available:', error);
      downloadHtmlFile(html);
      
      // Reset the generate button
      if (generateBtn) {
        generateBtn.innerHTML = '<i class="fas fa-file-export me-2"></i> Generate Bill of Lading';
        generateBtn.disabled = false;
      }
    });
  } catch (error) {
    console.log('Error in server API attempt:', error);
    // Fallback to client-side download
    downloadHtmlFile(html);
    
    // Reset the generate button
    if (generateBtn) {
      generateBtn.innerHTML = '<i class="fas fa-file-export me-2"></i> Generate Bill of Lading';
      generateBtn.disabled = false;
    }
  }
}

// Download the HTML file (client-side) - with improved UI
function downloadHtmlFile(html) {
  // Create a blob from the HTML content
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create a download link and trigger it
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bill_of_Lading_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  showNotification('Bill of Lading has been downloaded', 'success');
  
  // Also open in new tab
  openHtmlInNewTab(html);
}

// Open HTML in a new tab - unchanged
function openHtmlInNewTab(html) {
  // Create a blob and open it in a new tab
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// Add mock client data with enhanced visuals
function loadMockClientsData() {
  console.log("Loading mock clients data...");
  
  // Show loading indicator
  showNotification('Loading mock client data...', 'info');
  
  // Create mock client data
  const mockClients = [
    {
      "Client Name": "AquaPhoenix Scientific",
      "Client Code": "APS001",
      "Address": "860 Gitts Run Road",
      "City": "Hanover",
      "State": "PA",
      "ZIP": "17331",
      "Phone": "717-632-1291",
      "Email": "info@aquaphoenix.com",
      "Contact Person": "John Smith",
      "Status": "Active"
    },
    {
      "Client Name": "Brenntag North America",
      "Client Code": "BRN002",
      "Address": "5083 Pottsville Pike",
      "City": "Reading",
      "State": "PA",
      "ZIP": "19605",
      "Phone": "610-926-4151",
      "Email": "orders@brenntag.com",
      "Contact Person": "Sarah Johnson",
      "Status": "Active"
    },
    {
      "Client Name": "ChemTreat",
      "Client Code": "CHT003",
      "Address": "4301 Dominion Blvd",
      "City": "Glen Allen",
      "State": "VA",
      "ZIP": "23060",
      "Phone": "804-935-2000",
      "Email": "support@chemtreat.com",
      "Contact Person": "Michael Brown",
      "Status": "Active"
    },
    {
      "Client Name": "Univar Solutions",
      "Client Code": "UNV004",
      "Address": "3075 Highland Pkwy Suite 200",
      "City": "Downers Grove",
      "State": "IL",
      "ZIP": "60515",
      "Phone": "331-777-6000",
      "Email": "info@univar.com",
      "Contact Person": "Jennifer Davis",
      "Status": "Active"
    },
    {
      "Client Name": "Hawkins Inc",
      "Client Code": "HWK005",
      "Address": "2381 Rosegate",
      "City": "Roseville",
      "State": "MN",
      "ZIP": "55113",
      "Phone": "612-331-6910",
      "Email": "support@hawkinsinc.com",
      "Contact Person": "Robert Wilson",
      "Status": "Inactive"
    }
  ];
  
  // Use the mock data
  allClients = mockClients;
  clients = mockClients.filter(client => client["Status"] === "Active");
  
  // Update UI elements
  renderClientsTable(allClients);
  showClientCount();
  
  // Also populate the client dropdown in the BOL form
  populateClientDropdown();
  
  showNotification('Mock clients data loaded successfully', 'success');
  console.log(`Loaded ${allClients.length} mock clients (${clients.length} active)`);
}

// Enhanced mock data with improved variety and better organization
function loadMockInventoryData() {
  console.log("Loading mock inventory data...");
  
  // Show loading indicator
  showNotification('Loading mock inventory data...', 'info');
  
  // Create mock product data
  const mockProducts = [
    {
      "ID": "1",
      "Product Name": "Sulfuric Acid",
      "Product Code": "UN1830",
      "U/M": "LB",
      "Product Description": "Concentrated sulfuric acid 93-98%",
      "Grade": "Technical",
      "NMFC #": 45615,
      "Freight Class": 85,
      "Packing Group": "II",
      "Net Weight (Per Package)": 55,
      "Gross Weight (Per Package)": 58,
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "8",
      "Non Hazmat Class": null,
      "Account": "ACIDS",
      "Price": 1.25,
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "ID": "2",
      "Product Name": "Sodium Hydroxide",
      "Product Code": "UN1824",
      "U/M": "LB",
      "Product Description": "Caustic soda solution 50%",
      "Grade": "Technical",
      "NMFC #": 45635,
      "Freight Class": 85,
      "Packing Group": "II",
      "Net Weight (Per Package)": 55,
      "Gross Weight (Per Package)": 58,
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "8",
      "Non Hazmat Class": null,
      "Account": "BASES",
      "Price": 1.05,
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "ID": "3",
      "Product Name": "Hydrogen Peroxide",
      "Product Code": "UN2014",
      "U/M": "LB",
      "Product Description": "Hydrogen peroxide solution 35%",
      "Grade": "Technical",
      "NMFC #": 45617,
      "Freight Class": 85,
      "Packing Group": "II",
      "Net Weight (Per Package)": 55,
      "Gross Weight (Per Package)": 58,
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "5.1 (8)",
      "Non Hazmat Class": null,
      "Account": "OXIDIZERS",
      "Price": 1.75,
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "ID": "4",
      "Product Name": "Acetone",
      "Product Code": "UN1090",
      "U/M": "LB",
      "Product Description": "Pure acetone solvent",
      "Grade": "ACS",
      "NMFC #": 45612,
      "Freight Class": 85,
      "Packing Group": "II",
      "Net Weight (Per Package)": 44,
      "Gross Weight (Per Package)": 47,
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "3",
      "Non Hazmat Class": null,
      "Account": "SOLVENTS",
      "Price": 2.55,
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "ID": "5",
      "Product Name": "Glycerin",
      "Product Code": "GLY001",
      "U/M": "LB",
      "Product Description": "USP glycerin 99.5%",
      "Grade": "USP",
      "NMFC #": 45620,
      "Freight Class": 60,
      "Packing Group": "",
      "Net Weight (Per Package)": 55,
      "Gross Weight (Per Package)": 57,
      "Stackable?": "Yes",
      "Hazardous Material? (x if Yes)": "",
      "Hazmat Class": "",
      "Non Hazmat Class": 60,
      "Account": "GLYCOLS",
      "Price": 1.85,
      "Active Status": "Active",
      "Inventory Type": "NON-HAZMAT"
    }
  ];
  
  // Use the mock data
  allProducts = mockProducts;
  products = mockProducts.filter(product => product["Active Status"] === "Active");
  
  // Update UI elements
  renderInventoryTable(allProducts);
  showProductCount();
  
  showNotification('Mock inventory data loaded successfully', 'success');
  console.log(`Loaded ${allProducts.length} mock products (${products.length} active)`);
}

// Enhanced debug functions
function debugInventoryLoading() {
  console.log("=== DEBUG: Inventory Loading ===");
  
  // Show a notification that we're debugging
  showNotification('Running inventory loading diagnostics...', 'info');
  
  console.log("allProducts length:", allProducts.length);
  console.log("products length:", products.length);
  
  if (allProducts.length > 0) {
    console.log("Sample product:", allProducts[0]);
    console.log("Product keys:", Object.keys(allProducts[0]));
    showNotification(`Found ${allProducts.length} products (${products.length} active)`, 'success');
  } else {
    console.log("No products loaded!");
    showNotification('No products loaded in memory', 'warning');
  }
  
  // Check if DOM elements exist
  const table = document.getElementById('inventoryTable');
  const tbody = document.getElementById('inventoryTableBody');
  
  console.log("Table element exists:", !!table);
  console.log("Table body element exists:", !!tbody);
  
  if (!table || !tbody) {
    showNotification('Some UI elements are missing!', 'danger');
  }
  
  // Try loading mock data if real data not available
  if (allProducts.length === 0) {
    console.log("No products found, loading mock data instead");
    showNotification('Loading mock inventory data for testing', 'info');
    loadMockInventoryData();
  }
}

function debugClientsLoading() {
  console.log("=== DEBUG: Clients Loading ===");
  
  // Show a notification that we're debugging
  showNotification('Running client loading diagnostics...', 'info');
  
  console.log("allClients length:", allClients.length);
  console.log("clients length:", clients.length);
  
  if (allClients.length > 0) {
    console.log("Sample client:", allClients[0]);
    console.log("Client keys:", Object.keys(allClients[0]));
    showNotification(`Found ${allClients.length} clients (${clients.length} active)`, 'success');
  } else {
    console.log("No clients loaded!");
    showNotification('No clients loaded in memory', 'warning');
  }
  
  // Check if DOM elements exist
  const table = document.getElementById('clientsTable');
  const tbody = document.getElementById('clientsTableBody');
  const clientSelect = document.getElementById('clientSelect');
  
  console.log("Table element exists:", !!table);
  console.log("Table body element exists:", !!tbody);
  console.log("Client dropdown exists:", !!clientSelect);
  
  if (!table || !tbody || !clientSelect) {
    showNotification('Some UI elements are missing!', 'danger');
  }
  
  // Try loading mock data if real data not available
  if (allClients.length === 0) {
    console.log("No clients found, loading mock data instead");
    showNotification('Loading mock client data for testing', 'info');
    loadMockClientsData();
  } else {
    // Try to populate the dropdown again
    console.log("Re-populating client dropdown");
    populateClientDropdown();
    showNotification('Client dropdown repopulated', 'success');
  }
}

// Wait a short time after page load to check if data loaded correctly
// Enhanced with better visual indicators
setTimeout(function() {
  // Check authentication again in case of delayed logout
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  
  if (!isLoggedIn && !rememberMe) {
    // If no longer authenticated, redirect to login
    window.location.href = 'login.html';
    return;
  }
  
  if (allProducts.length === 0) {
    console.log("No products loaded after timeout, loading mock data");
    showNotification('Server connection issue detected', 'warning');
    setTimeout(() => {
      showNotification('Loading mock product data', 'info');
      loadMockInventoryData();
    }, 1000);
  }
  
  if (allClients.length === 0) {
    console.log("No clients loaded after timeout, loading mock data");
    setTimeout(() => {
      showNotification('Loading mock client data', 'info');
      loadMockClientsData();
    }, 2000);
  }
}, 3000);

// Make debug functions available globally
window.debugInventory = debugInventoryLoading;
window.debugClients = debugClientsLoading;
window.loadMockData = loadMockInventoryData;
window.loadMockClientsData = loadMockClientsData;
window.removePoNumber = removePoNumber;
window.updateItem = updateItem;
window.removeItem = removeItem;
