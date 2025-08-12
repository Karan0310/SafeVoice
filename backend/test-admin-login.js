const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login and Dashboard...\n');

  try {
    // Test 1: Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'super_admin',
        password: 'SafeVoice2024!'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`❌ Login failed: ${loginResponse.status} - ${errorText}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log(`   Token: ${loginData.token ? 'Present' : 'Missing'}`);
    console.log(`   Admin: ${loginData.admin?.username} (${loginData.admin?.department})`);

    if (!loginData.token) {
      console.error('❌ No token received');
      return;
    }

    // Test 2: Admin Dashboard
    console.log('\n2️⃣ Testing Admin Dashboard...');
    const dashboardResponse = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (!dashboardResponse.ok) {
      const errorText = await dashboardResponse.text();
      console.error(`❌ Dashboard failed: ${dashboardResponse.status} - ${errorText}`);
      return;
    }

    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard loaded successfully!');
    console.log(`   Total Reports: ${dashboardData.totalReports}`);
    console.log(`   Active Agents: ${dashboardData.activeAgents}`);
    console.log(`   Departments: ${dashboardData.departmentStats?.length || 0}`);
    console.log(`   AI Metrics: ${dashboardData.aiMetrics ? 'Present' : 'Missing'}`);

    // Test 3: Check Department Cases
    console.log('\n3️⃣ Testing Department Cases...');
    for (const dept of dashboardData.departmentStats || []) {
      const casesResponse = await fetch(`${API_BASE}/admin/department/${dept.id}/cases?limit=5`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        console.log(`   ${dept.name}: ${casesData.cases?.length || 0} cases (showing first 5)`);
      } else {
        console.log(`   ${dept.name}: Failed to load cases`);
      }
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminLogin();
