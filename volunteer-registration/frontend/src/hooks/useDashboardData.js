import { useState, useEffect } from 'react';

const useDashboardData = () => {
  const [stats, setStats] = useState([
    {
      title: 'Active Users',
      value: '4',
      icon: 'users',
      isPercentage: false
    },
    {
      title: 'Pending Approval',
      value: '4',
      subtitle: 'out of 42',
      icon: 'clock',
      isPercentage: false
    },
    {
      title: 'This Month',
      value: '0h',
      subtitle: '0 Submissions',
      icon: 'trending',
      isPercentage: false
    },
    {
      title: 'Total Approved',
      value: '100%',
      subtitle: 'User completion Rate',
      icon: null,
      isPercentage: true
    }
  ]);

  const [quickActions] = useState([
    {
      title: 'View Pending Approvals',
      description: 'Preview submitted hours',
      icon: 'clipboard'
    },
    {
      title: 'View All Volunteers',
      description: 'Manage volunteer profiles',
      icon: 'users'
    },
    {
      title: 'Send Announcement',
      description: 'Communicate with volunteers',
      icon: 'message'
    }
  ]);

  const [managementTools] = useState([
    {
      title: 'Review Pending Hours',
      description: '4 pending submissions requiring approval',
      icon: 'clipboard-check'
    },
    {
      title: 'Approved Hours History',
      description: 'View all approved hours with filters and export options',
      icon: 'list'
    },
    {
      title: 'Generate Reports',
      description: 'Create reports for volunteer hours and participation data',
      icon: 'settings'
    },
    {
      title: 'Manage Announcements',
      description: 'Create and publish announcements to all volunteers',
      icon: 'document'
    },
    {
      title: 'Volunteer Directory',
      description: 'Search and view all volunteer profiles and their contributions',
      icon: 'directory'
    },
    {
      title: 'Adjust Submitted Hours',
      description: 'Edit times during the approval process with reason tracking',
      icon: 'edit'
    }
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return { stats, quickActions, managementTools };
};

export default useDashboardData;