// backend/src/routes/demo.js - Demo API Routes
const express = require('express');
const router = express.Router();

let demoService = null;

// Initialize demo service
const initializeDemoService = (db, notificationService, emailService) => {
  const DemoService = require('../services/demoService');
  demoService = new DemoService(db, notificationService, emailService);
  console.log('🎭 Demo routes initialized');
};

// Start demo workflow
router.post('/start', async (req, res) => {
  try {
    if (!demoService) {
      return res.status(500).json({
        success: false,
        error: 'Demo service not initialized'
      });
    }

    console.log('🚀 Demo start requested');
    
    // Start demo in background
    demoService.startDemo()
      .then(result => {
        console.log('✅ Demo completed successfully:', result.message);
      })
      .catch(error => {
        console.error('❌ Demo failed:', error.message);
      });

    res.json({
      success: true,
      message: 'Demo workflow started successfully',
      demoId: `demo_${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Error starting demo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start demo',
      details: error.message
    });
  }
});

// Get demo status
router.get('/status', (req, res) => {
  try {
    if (!demoService) {
      return res.status(500).json({
        success: false,
        error: 'Demo service not initialized'
      });
    }

    const status = demoService.getDemoStatus();
    
    res.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('❌ Error getting demo status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get demo status',
      details: error.message
    });
  }
});

// Stop demo
router.post('/stop', (req, res) => {
  try {
    if (!demoService) {
      return res.status(500).json({
        success: false,
        error: 'Demo service not initialized'
      });
    }

    const stopped = demoService.stopDemo();
    
    res.json({
      success: true,
      message: stopped ? 'Demo stopped successfully' : 'No demo was running',
      stopped: stopped
    });

  } catch (error) {
    console.error('❌ Error stopping demo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop demo',
      details: error.message
    });
  }
});

// Reset demo data
router.post('/reset', async (req, res) => {
  try {
    if (!demoService) {
      return res.status(500).json({
        success: false,
        error: 'Demo service not initialized'
      });
    }

    console.log('🔄 Demo reset requested');
    
    await demoService.resetDemoData();
    
    res.json({
      success: true,
      message: 'Demo data reset successfully'
    });

  } catch (error) {
    console.error('❌ Error resetting demo data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset demo data',
      details: error.message
    });
  }
});

// Get demo steps
router.get('/steps', (req, res) => {
  try {
    if (!demoService) {
      return res.status(500).json({
        success: false,
        error: 'Demo service not initialized'
      });
    }

    const status = demoService.getDemoStatus();
    
    res.json({
      success: true,
      steps: status.steps,
      currentStep: status.currentStep
    });

  } catch (error) {
    console.error('❌ Error getting demo steps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get demo steps',
      details: error.message
    });
  }
});

// Note: WebSocket functionality will be handled by the main server WebSocket instance
// This route file focuses on HTTP endpoints only

module.exports = { router, initializeDemoService };
