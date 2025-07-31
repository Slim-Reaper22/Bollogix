const express = require('express');
const path = require('path');
const cors = require('cors');
const { parse, unparse } = require('papaparse');
const { pool, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Initialize database on startup
initializeDatabase().catch(console.error);

// Helper function to convert database rows to CSV format
const convertToCSVFormat = (rows, type) => {
  if (type === 'products') {
    return rows.map(row => ({
      "ID": row.id ? row.id.toString() : null, // ADD THIS LINE
      "Product Name": row.product_name,
      "Product Code": row.product_code,
      "U/M": row.unit_of_measure,
      "Product Description": row.product_description,
      "Grade": row.grade,
      "NMFC #": row.nmfc_number,
      "Freight Class": row.freight_class,
      "Packing Group": row.packing_group,
      "Net Weight (Per Package)": row.net_weight,
      "Gross Weight (Per Package)": row.gross_weight,
      "Stackable?": row.stackable,
      "Hazardous Material? (x if Yes)": row.hazardous_material,
      "Hazmat Class": row.hazmat_class,
      "Non Hazmat Class": row.non_hazmat_class,
      "Account": row.account,
      "Price": row.price,
      "Active Status": row.active_status,
      "Inventory Type": row.inventory_type
    }));
  } else if (type === 'clients') {
    return rows.map(row => ({
      "Client Name": row.client_name,
      "Client Code": row.client_code,
      "Address": row.address,
      "City": row.city,
      "State": row.state,
      "ZIP": row.zip,
      "Phone": row.phone,
      "Email": row.email,
      "Contact Person": row.contact_person,
      "Status": row.status
    }));
  }
};

// Route to serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get inventory from database
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_name');
    const products = convertToCSVFormat(result.rows, 'products');
    res.json({ products });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// API endpoint to get clients from database
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY client_name');
    const clients = convertToCSVFormat(result.rows, 'clients');
    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// API endpoint to update inventory (bulk update)
app.post('/api/inventory/update', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products data format' });
    }

    // Start transaction
    await pool.query('BEGIN');

    // Clear existing products
    await pool.query('DELETE FROM products');

    // Insert all products
    for (const product of products) {
      // If product has an ID, try to use it (for maintaining consistency)
      if (product["ID"] && !isNaN(parseInt(product["ID"]))) {
        await pool.query(`
          INSERT INTO products (
            id, product_name, product_code, unit_of_measure, product_description,
            grade, nmfc_number, freight_class, packing_group,
            net_weight, gross_weight, stackable, hazardous_material,
            hazmat_class, non_hazmat_class, account, price,
            active_status, inventory_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          parseInt(product["ID"]),
          product["Product Name"], product["Product Code"], product["U/M"],
          product["Product Description"], product["Grade"], product["NMFC #"],
          product["Freight Class"], product["Packing Group"], 
          parseFloat(product["Net Weight (Per Package)"]) || 0,
          parseFloat(product["Gross Weight (Per Package)"]) || 0,
          product["Stackable?"], product["Hazardous Material? (x if Yes)"],
          product["Hazmat Class"], product["Non Hazmat Class"], product["Account"],
          parseFloat(product["Price"]) || 0, product["Active Status"], 
          product["Inventory Type"]
        ]);
      } else {
        // No ID provided, let database auto-generate
        await pool.query(`
          INSERT INTO products (
            product_name, product_code, unit_of_measure, product_description,
            grade, nmfc_number, freight_class, packing_group,
            net_weight, gross_weight, stackable, hazardous_material,
            hazmat_class, non_hazmat_class, account, price,
            active_status, inventory_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
          product["Product Name"], product["Product Code"], product["U/M"],
          product["Product Description"], product["Grade"], product["NMFC #"],
          product["Freight Class"], product["Packing Group"], 
          parseFloat(product["Net Weight (Per Package)"]) || 0,
          parseFloat(product["Gross Weight (Per Package)"]) || 0,
          product["Stackable?"], product["Hazardous Material? (x if Yes)"],
          product["Hazmat Class"], product["Non Hazmat Class"], product["Account"],
          parseFloat(product["Price"]) || 0, product["Active Status"], 
          product["Inventory Type"]
        ]);
      }
    }

    // Reset sequence to max ID to avoid conflicts
    await pool.query(`
      SELECT setval('products_id_seq', (SELECT MAX(id) FROM products), true)
    `);

    await pool.query('COMMIT');
    res.json({ success: true, message: 'Inventory updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// API endpoint to update clients (bulk update)
app.post('/api/clients/update', async (req, res) => {
  try {
    const { clients } = req.body;
    
    if (!Array.isArray(clients)) {
      return res.status(400).json({ error: 'Invalid clients data format' });
    }

    // Start transaction
    await pool.query('BEGIN');

    // Clear existing clients
    await pool.query('DELETE FROM clients');

    // Insert all clients
    for (const client of clients) {
      await pool.query(`
        INSERT INTO clients (
          client_name, client_code, address, city, state,
          zip, phone, email, contact_person, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        client["Client Name"], client["Client Code"], client["Address"],
        client["City"], client["State"], client["ZIP"], client["Phone"],
        client["Email"], client["Contact Person"], client["Status"]
      ]);
    }

    await pool.query('COMMIT');
    res.json({ success: true, message: 'Clients updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating clients:', error);
    res.status(500).json({ error: 'Failed to update clients' });
  }
});

// API endpoint to add a new product
app.post('/api/inventory/add', async (req, res) => {
  try {
    const { product } = req.body;
    
    if (!product || !product["Product Name"] || !product["Product Code"]) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const result = await pool.query(`
      INSERT INTO products (
        product_name, product_code, unit_of_measure, product_description,
        grade, nmfc_number, freight_class, packing_group,
        net_weight, gross_weight, stackable, hazardous_material,
        hazmat_class, non_hazmat_class, account, price,
        active_status, inventory_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      product["Product Name"], product["Product Code"], product["U/M"],
      product["Product Description"], product["Grade"], product["NMFC #"],
      product["Freight Class"], product["Packing Group"], 
      parseFloat(product["Net Weight (Per Package)"]) || 0,
      parseFloat(product["Gross Weight (Per Package)"]) || 0,
      product["Stackable?"], product["Hazardous Material? (x if Yes)"],
      product["Hazmat Class"], product["Non Hazmat Class"], product["Account"],
      parseFloat(product["Price"]) || 0, product["Active Status"], 
      product["Inventory Type"]
    ]);

    res.json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Product code already exists' });
    } else {
      console.error('Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  }
});

// API endpoint to add a new client
app.post('/api/clients/add', async (req, res) => {
  try {
    const { client } = req.body;
    
    if (!client || !client["Client Name"] || !client["Client Code"]) {
      return res.status(400).json({ error: 'Invalid client data' });
    }

    const result = await pool.query(`
      INSERT INTO clients (
        client_name, client_code, address, city, state,
        zip, phone, email, contact_person, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      client["Client Name"], client["Client Code"], client["Address"],
      client["City"], client["State"], client["ZIP"], client["Phone"],
      client["Email"], client["Contact Person"], client["Status"]
    ]);

    res.json({ success: true, message: 'Client added successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Client code already exists' });
    } else {
      console.error('Error adding client:', error);
      res.status(500).json({ error: 'Failed to add client' });
    }
  }
});

// API endpoint to update a specific product BY ID (CHANGED FROM PRODUCT CODE)
app.put('/api/inventory/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const { product } = req.body;
    
    if (!product || !product["Product Name"] || !product["Product Code"]) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const result = await pool.query(`
      UPDATE products SET
        product_name = $1, product_code = $2, unit_of_measure = $3,
        product_description = $4, grade = $5, nmfc_number = $6,
        freight_class = $7, packing_group = $8, net_weight = $9,
        gross_weight = $10, stackable = $11, hazardous_material = $12,
        hazmat_class = $13, non_hazmat_class = $14, account = $15,
        price = $16, active_status = $17, inventory_type = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
    `, [
      product["Product Name"], product["Product Code"], product["U/M"],
      product["Product Description"], product["Grade"], product["NMFC #"],
      product["Freight Class"], product["Packing Group"], 
      parseFloat(product["Net Weight (Per Package)"]) || 0,
      parseFloat(product["Gross Weight (Per Package)"]) || 0,
      product["Stackable?"], product["Hazardous Material? (x if Yes)"],
      product["Hazmat Class"], product["Non Hazmat Class"], product["Account"],
      parseFloat(product["Price"]) || 0, product["Active Status"], 
      product["Inventory Type"], parseInt(productId)
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'New product code already exists' });
    } else {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
});

// API endpoint to update a specific client
app.put('/api/clients/:clientCode', async (req, res) => {
  try {
    const clientCode = req.params.clientCode;
    const { client } = req.body;
    
    if (!client || !client["Client Name"] || !client["Client Code"]) {
      return res.status(400).json({ error: 'Invalid client data' });
    }

    const result = await pool.query(`
      UPDATE clients SET
        client_name = $1, client_code = $2, address = $3,
        city = $4, state = $5, zip = $6, phone = $7,
        email = $8, contact_person = $9, status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE client_code = $11
      RETURNING *
    `, [
      client["Client Name"], client["Client Code"], client["Address"],
      client["City"], client["State"], client["ZIP"], client["Phone"],
      client["Email"], client["Contact Person"], client["Status"],
      clientCode
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ success: true, message: 'Client updated successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'New client code already exists' });
    } else {
      console.error('Error updating client:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  }
});

// API endpoint to delete a product BY ID (CHANGED FROM PRODUCT CODE)
app.delete('/api/inventory/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [parseInt(productId)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// API endpoint to delete a client
app.delete('/api/clients/:clientCode', async (req, res) => {
  try {
    const clientCode = req.params.clientCode;
    
    const result = await pool.query(
      'DELETE FROM clients WHERE client_code = $1 RETURNING *',
      [clientCode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Export inventory to CSV
app.get('/api/inventory/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_name');
    const products = convertToCSVFormat(result.rows, 'products');
    const csv = unparse(products);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ error: 'Failed to export inventory' });
  }
});

// Export clients to CSV
app.get('/api/clients/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY client_name');
    const clients = convertToCSVFormat(result.rows, 'clients');
    const csv = unparse(clients);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Clients_Export_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting clients:', error);
    res.status(500).json({ error: 'Failed to export clients' });
  }
});

// API endpoint to save BOL
app.post('/api/save-bol', async (req, res) => {
  try {
    const { content, filename = 'Bill_of_Lading.html' } = req.body;
    
    await pool.query(
      'INSERT INTO bills_of_lading (filename, content) VALUES ($1, $2)',
      [filename, content]
    );
    
    res.json({ success: true, message: `BOL saved as ${filename}` });
  } catch (error) {
    console.error('Error saving BOL:', error);
    res.status(500).json({ error: 'Failed to save BOL' });
  }
});

// API endpoint to get list of BOLs
app.get('/api/bol-files', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, filename, created_at, LENGTH(content) as size FROM bills_of_lading ORDER BY created_at DESC LIMIT 20'
    );
    
    const files = result.rows.map(row => ({
      name: row.filename,
      created: row.created_at,
      size: parseInt(row.size)
    }));
    
    res.json({ files });
  } catch (error) {
    console.error('Error getting BOL files:', error);
    res.status(500).json({ error: 'Failed to get BOL files' });
  }
});

// API endpoint to view a specific BOL
app.get('/api/view-bol/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    const result = await pool.query(
      'SELECT content FROM bills_of_lading WHERE filename = $1 ORDER BY created_at DESC LIMIT 1',
      [filename]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.send(result.rows[0].content);
  } catch (error) {
    console.error('Error reading BOL file:', error);
    res.status(500).json({ error: 'Failed to read BOL file' });
  }
});

// API endpoint to get CSV files (not used with database, but kept for compatibility)
app.get('/api/csv-files', (req, res) => {
  res.json({ files: [] });
});

// API endpoint to read CSV (not used with database, but kept for compatibility)
app.get('/api/read-csv/:filename', (req, res) => {
  res.status(404).json({ error: 'File system not available in database mode' });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using PostgreSQL database');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
