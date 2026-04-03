import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Switch, Button, Modal, Alert } from 'antd';
import { UserOutlined, ShopOutlined, CrownOutlined } from '@ant-design/icons';

const RoleSwitcher = () => {
  const { user, activeRole, switchRole, toggleActiveRole, enablePublisherRole, isPublisher } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPublisherModal, setShowPublisherModal] = useState(false);

  const handleSwitch = async (role) => {
    setLoading(true);
    try {
      await switchRole(role);
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePublisher = async () => {
    setLoading(true);
    try {
      await enablePublisherRole();
      await switchRole('publisher');
      setShowPublisherModal(false);
    } catch (error) {
      console.error('Failed to enable publisher role:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'advertiser':
        return <ShopOutlined />;
      case 'publisher':
        return <UserOutlined />;
      case 'admin':
        return <CrownOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'advertiser':
        return '#1890ff';
      case 'publisher':
        return '#52c41a';
      case 'admin':
        return '#faad14';
      case 'superadmin':
        return '#f5222d';
      default:
        return '#666';
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="role-switcher" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>Mode:</span>
        
        {/* Advertiser/Publisher Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            style={{ 
              color: activeRole === 'advertiser' ? getRoleColor('advertiser') : '#999',
              fontWeight: activeRole === 'advertiser' ? 'bold' : 'normal'
            }}
          >
            <ShopOutlined /> Advertiser
          </span>
          
          <Switch
            checked={activeRole === 'publisher'}
            onChange={() => {
              if (!isPublisher()) {
                setShowPublisherModal(true);
              } else {
                handleSwitch('publisher');
              }
            }}
            loading={loading}
            disabled={!user.roles.advertiser && !user.roles.publisher}
          />
          
          <span 
            style={{ 
              color: activeRole === 'publisher' ? getRoleColor('publisher') : '#999',
              fontWeight: activeRole === 'publisher' ? 'bold' : 'normal'
            }}
          >
            <UserOutlined /> Publisher
          </span>
        </div>

        {/* Admin/SuperAdmin Badge */}
        {(user.roles.isAdmin || user.roles.isSuperAdmin) && (
          <div style={{ marginLeft: '16px' }}>
            <span 
              style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getRoleColor(user.roles.isSuperAdmin ? 'superadmin' : 'admin'),
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {getRoleIcon(user.roles.isSuperAdmin ? 'superadmin' : 'admin')}
              {' '}{user.roles.isSuperAdmin ? 'SUPERADMIN' : 'ADMIN'}
            </span>
          </div>
        )}
      </div>

      {/* Enable Publisher Modal */}
      <Modal
        title="Enable Publisher Mode"
        open={showPublisherModal}
        onCancel={() => setShowPublisherModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowPublisherModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="enable" 
            type="primary" 
            loading={loading}
            onClick={handleEnablePublisher}
          >
            Enable Publisher
          </Button>
        ]}
      >
        <Alert
          message="Unlock Publisher Features"
          description="By enabling publisher mode, you'll be able to:
            • Add and manage your Telegram groups/channels
            • Earn money from ads posted in your groups
            • View detailed analytics and earnings
            • Request withdrawals"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <p>Ready to start earning from your Telegram groups?</p>
      </Modal>
    </>
  );
};

export default RoleSwitcher;
