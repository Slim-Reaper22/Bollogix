// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { parse, unparse } = require('papaparse');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for Render deployment (since free tier doesn't persist files)
let productsData = [];
let clientsData = [];
let bolFiles = [];

// Initialize with demo data
const initializeDemoData = () => {
  // Demo products
  productsData = [
    {
      "Product Name": "Sulfuric Acid",
      "Product Code": "UN1830",
      "U/M": "LB",
      "Product Description": "Concentrated sulfuric acid 93-98%",
      "Grade": "Technical",
      "NMFC #": "45615",
      "Freight Class": "85",
      "Packing Group": "II",
      "Net Weight (Per Package)": "55",
      "Gross Weight (Per Package)": "58",
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "8",
      "Non Hazmat Class": "",
      "Account": "ACIDS",
      "Price": "1.25",
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "Product Name": "Sodium Hydroxide",
      "Product Code": "UN1824",
      "U/M": "LB",
      "Product Description": "Caustic soda solution 50%",
      "Grade": "Technical",
      "NMFC #": "45635",
      "Freight Class": "85",
      "Packing Group": "II",
      "Net Weight (Per Package)": "55",
      "Gross Weight (Per Package)": "58",
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "8",
      "Non Hazmat Class": "",
      "Account": "BASES",
      "Price": "1.05",
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "Product Name": "Hydrogen Peroxide",
      "Product Code": "UN2014",
      "U/M": "LB",
      "Product Description": "Hydrogen peroxide solution 35%",
      "Grade": "Technical",
      "NMFC #": "45617",
      "Freight Class": "85",
      "Packing Group": "II",
      "Net Weight (Per Package)": "55",
      "Gross Weight (Per Package)": "58",
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "5.1 (8)",
      "Non Hazmat Class": "",
      "Account": "OXIDIZERS",
      "Price": "1.75",
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "Product Name": "Acetone",
      "Product Code": "UN1090",
      "U/M": "LB",
      "Product Description": "Pure acetone solvent",
      "Grade": "ACS",
      "NMFC #": "45612",
      "Freight Class": "85",
      "Packing Group": "II",
      "Net Weight (Per Package)": "44",
      "Gross Weight (Per Package)": "47",
      "Stackable?": "No",
      "Hazardous Material? (x if Yes)": "x",
      "Hazmat Class": "3",
      "Non Hazmat Class": "",
      "Account": "SOLVENTS",
      "Price": "2.55",
      "Active Status": "Active",
      "Inventory Type": "HAZMAT"
    },
    {
      "Product Name": "Glycerin",
      "Product Code": "GLY001",
      "U/M": "LB",
      "Product Description": "USP glycerin 99.5%",
      "Grade": "USP",
      "NMFC #": "45620",
      "Freight Class": "60",
      "Packing Group": "",
      "Net Weight (Per Package)": "55",
      "Gross Weight (Per Package)": "57",
      "Stackable?": "Yes",
      "Hazardous Material? (x if Yes)": "",
      "Hazmat Class": "",
      "Non Hazmat Class": "60",
      "Account": "GLYCOLS",
      "Price": "1.85",
      "Active Status": "Active",
      "Inventory Type": "NON-HAZMAT"
    }
  ];

  // Demo clients
  clientsData = [
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
};

// Initialize demo data on startup
initializeDemoData();

// Configure middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Route to serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get the main inventory data
app.get('/api/inventory', (req, res) => {
  try {
    res.json({ products: productsData });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// API endpoint to get the clients data
app.get('/api/clients', (req, res) => {
  try {
    res.json({ clients: clientsData });
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ error: 'Failed to get clients' });
  }
});

// API endpoint to update inventory (add, edit, delete)
app.post('/api/inventory/update', (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products data format' });
    }
    
    // Update in-memory storage
    productsData = products;
    
    res.json({ success: true, message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory: ' + error.message });
  }
});

// API endpoint to update clients (add, edit, delete)
app.post('/api/clients/update', (req, res) => {
  try {
    const { clients } = req.body;
    
    if (!Array.isArray(clients)) {
      return res.status(400).json({ error: 'Invalid clients data format' });
    }
    
    // Update in-memory storage
    clientsData = clients;
    
    res.json({ success: true, message: 'Clients updated successfully' });
  } catch (error) {
    console.error('Error updating clients:', error);
    res.status(500).json({ error: 'Failed to update clients: ' + error.message });
  }
});

// API endpoint to add a new product
app.post('/api/inventory/add', (req, res) => {
  try {
    const { product } = req.body;
    
    if (!product || !product["Product Name"] || !product["Product Code"]) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    
    // Check if product code already exists
    const productExists = productsData.some(p => p["Product Code"] === product["Product Code"]);
    if (productExists) {
      return res.status(400).json({ error: 'Product code already exists' });
    }
    
    // Add new product
    productsData.push(product);
    
    res.json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product: ' + error.message });
  }
});

// API endpoint to add a new client
app.post('/api/clients/add', (req, res) => {
  try {
    const { client } = req.body;
    
    if (!client || !client["Client Name"] || !client["Client Code"]) {
      return res.status(400).json({ error: 'Invalid client data' });
    }
    
    // Check if client code already exists
    const clientExists = clientsData.some(c => c["Client Code"] === client["Client Code"]);
    if (clientExists) {
      return res.status(400).json({ error: 'Client code already exists' });
    }
    
    // Add new client
    clientsData.push(client);
    
    res.json({ success: true, message: 'Client added successfully' });
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ error: 'Failed to add client: ' + error.message });
  }
});

// API endpoint to update a specific product
app.put('/api/inventory/:productCode', (req, res) => {
  try {
    const productCode = req.params.productCode;
    const { product } = req.body;
    
    if (!product || !product["Product Name"] || !product["Product Code"]) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    
    // Find the product to update
    const index = productsData.findIndex(p => p["Product Code"] === productCode);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // If product code is changing, check it doesn't conflict
    if (product["Product Code"] !== productCode) {
      const codeExists = productsData.some(p => 
        p["Product Code"] === product["Product Code"] && p["Product Code"] !== productCode
      );
      
      if (codeExists) {
        return res.status(400).json({ error: 'New product code already exists' });
      }
    }
    
    // Update the product
    productsData[index] = product;
    
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product: ' + error.message });
  }
});

// API endpoint to update a specific client
app.put('/api/clients/:clientCode', (req, res) => {
  try {
    const clientCode = req.params.clientCode;
    const { client } = req.body;
    
    if (!client || !client["Client Name"] || !client["Client Code"]) {
      return res.status(400).json({ error: 'Invalid client data' });
    }
    
    // Find the client to update
    const index = clientsData.findIndex(c => c["Client Code"] === clientCode);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // If client code is changing, check it doesn't conflict
    if (client["Client Code"] !== clientCode) {
      const codeExists = clientsData.some(c => 
        c["Client Code"] === client["Client Code"] && c["Client Code"] !== clientCode
      );
      
      if (codeExists) {
        return res.status(400).json({ error: 'New client code already exists' });
      }
    }
    
    // Update the client
    clientsData[index] = client;
    
    res.json({ success: true, message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client: ' + error.message });
  }
});

// API endpoint to delete a product
app.delete('/api/inventory/:productCode', (req, res) => {
  try {
    const productCode = req.params.productCode;
    
    // Check if product exists
    const productExists = productsData.some(p => p["Product Code"] === productCode);
    
    if (!productExists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Filter out the product to delete
    productsData = productsData.filter(p => p["Product Code"] !== productCode);
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product: ' + error.message });
  }
});

// API endpoint to delete a client
app.delete('/api/clients/:clientCode', (req, res) => {
  try {
    const clientCode = req.params.clientCode;
    
    // Check if client exists
    const clientExists = clientsData.some(c => c["Client Code"] === clientCode);
    
    if (!clientExists) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Filter out the client to delete
    clientsData = clientsData.filter(c => c["Client Code"] !== clientCode);
    
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client: ' + error.message });
  }
});

// API endpoint to get a list of CSV files (returns empty for in-memory version)
app.get('/api/csv-files', (req, res) => {
  try {
    // Return empty array since we're using in-memory storage
    res.json({ files: [] });
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

// Export clients to CSV
app.get('/api/clients/export', (req, res) => {
  try {
    const csv = unparse(clientsData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Clients_Export_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting clients:', error);
    res.status(500).json({ error: 'Failed to export clients' });
  }
});

// API endpoint to save a generated BOL (stored in memory)
app.post('/api/save-bol', (req, res) => {
  try {
    const { content, filename = 'Bill_of_Lading.html' } = req.body;
    
    // Store in memory
    bolFiles.push({
      name: filename,
      content: content,
      created: new Date(),
      size: content.length
    });
    
    // Keep only last 20 BOLs to prevent memory issues
    if (bolFiles.length > 20) {
      bolFiles = bolFiles.slice(-20);
    }
    
    res.json({ success: true, message: `File saved as ${filename}` });
  } catch (error) {
    console.error('Error saving BOL:', error);
    res.status(500).json({ error: 'Failed to save BOL' });
  }
});

// API endpoint to get a list of generated BOLs
app.get('/api/bol-files', (req, res) => {
  try {
    const files = bolFiles.map(({ content, ...file }) => file)
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({ files });
  } catch (error) {
    console.error('Error getting BOL files:', error);
    res.status(500).json({ error: 'Failed to get BOL files' });
  }
});

// API endpoint to view a specific BOL
app.get('/api/view-bol/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const bolFile = bolFiles.find(file => file.name === filename);
    
    if (!bolFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.send(bolFile.content);
  } catch (error) {
    console.error('Error reading BOL file:', error);
    res.status(500).json({ error: 'Failed to read BOL file' });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Bill of Lading Generator server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Using in-memory storage for demo deployment`);
  console.log(`${productsData.length} products loaded`);
  console.log(`${clientsData.length} clients loaded`);
});
