const { Pool } = require('pg');

// Create pool using DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create tables if they don't exist
const initializeDatabase = async () => {
  try {
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        product_code VARCHAR(100) UNIQUE NOT NULL,
        unit_of_measure VARCHAR(50),
        product_description TEXT,
        grade VARCHAR(100),
        nmfc_number VARCHAR(50),
        freight_class VARCHAR(50),
        packing_group VARCHAR(10),
        net_weight DECIMAL(10,2),
        gross_weight DECIMAL(10,2),
        stackable VARCHAR(10),
        hazardous_material VARCHAR(10),
        hazmat_class VARCHAR(50),
        non_hazmat_class VARCHAR(50),
        account VARCHAR(100),
        price DECIMAL(10,2),
        active_status VARCHAR(50),
        inventory_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_code VARCHAR(100) UNIQUE NOT NULL,
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        contact_person VARCHAR(255),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create BOL table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills_of_lading (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');

    // Insert demo data if tables are empty
    await insertDemoData();

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Insert demo data if tables are empty
const insertDemoData = async () => {
  try {
    // Check if products table is empty
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    
    if (productCount.rows[0].count === '0') {
      console.log('Inserting demo products...');
      
      const demoProducts = [
        {
          product_name: 'Sulfuric Acid',
          product_code: 'UN1830',
          unit_of_measure: 'LB',
          product_description: 'Concentrated sulfuric acid 93-98%',
          grade: 'Technical',
          nmfc_number: '45615',
          freight_class: '85',
          packing_group: 'II',
          net_weight: 55,
          gross_weight: 58,
          stackable: 'No',
          hazardous_material: 'x',
          hazmat_class: '8',
          non_hazmat_class: '',
          account: 'ACIDS',
          price: 1.25,
          active_status: 'Active',
          inventory_type: 'HAZMAT'
        },
        {
          product_name: 'Sodium Hydroxide',
          product_code: 'UN1824',
          unit_of_measure: 'LB',
          product_description: 'Caustic soda solution 50%',
          grade: 'Technical',
          nmfc_number: '45635',
          freight_class: '85',
          packing_group: 'II',
          net_weight: 55,
          gross_weight: 58,
          stackable: 'No',
          hazardous_material: 'x',
          hazmat_class: '8',
          non_hazmat_class: '',
          account: 'BASES',
          price: 1.05,
          active_status: 'Active',
          inventory_type: 'HAZMAT'
        }
      ];

      for (const product of demoProducts) {
        await pool.query(`
          INSERT INTO products (
            product_name, product_code, unit_of_measure, product_description,
            grade, nmfc_number, freight_class, packing_group,
            net_weight, gross_weight, stackable, hazardous_material,
            hazmat_class, non_hazmat_class, account, price,
            active_status, inventory_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
          product.product_name, product.product_code, product.unit_of_measure,
          product.product_description, product.grade, product.nmfc_number,
          product.freight_class, product.packing_group, product.net_weight,
          product.gross_weight, product.stackable, product.hazardous_material,
          product.hazmat_class, product.non_hazmat_class, product.account,
          product.price, product.active_status, product.inventory_type
        ]);
      }
    }

    // Check if clients table is empty
    const clientCount = await pool.query('SELECT COUNT(*) FROM clients');
    
    if (clientCount.rows[0].count === '0') {
      console.log('Inserting demo clients...');
      
      const demoClients = [
        {
          client_name: 'AquaPhoenix Scientific',
          client_code: 'APS001',
          address: '860 Gitts Run Road',
          city: 'Hanover',
          state: 'PA',
          zip: '17331',
          phone: '717-632-1291',
          email: 'info@aquaphoenix.com',
          contact_person: 'John Smith',
          status: 'Active'
        }
      ];

      for (const client of demoClients) {
        await pool.query(`
          INSERT INTO clients (
            client_name, client_code, address, city, state,
            zip, phone, email, contact_person, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          client.client_name, client.client_code, client.address,
          client.city, client.state, client.zip, client.phone,
          client.email, client.contact_person, client.status
        ]);
      }
    }

  } catch (error) {
    console.error('Error inserting demo data:', error);
  }
};

module.exports = {
  pool,
  initializeDatabase
};
