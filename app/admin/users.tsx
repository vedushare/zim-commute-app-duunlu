
import { IconSymbol } from '@/components/IconSymbol';
import type { AdminUser } from '@/types/admin';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { getAdminUsers, banUser, unbanUser, adjustUserWallet, getUserOTP, createUser, updateUser } from '@/utils/adminApi';
import { CustomModal } from '@/components/ui/CustomModal';
import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import Button from '@/components/button';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  
  // Action modal states
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'wallet' | 'otp' | 'create' | 'edit'>('ban');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [actionAmount, setActionAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // OTP display
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);
  
  // Create/Edit user modal
  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    phoneNumber: '',
    fullName: '',
    email: '',
    userType: 'Passenger' as 'Passenger' | 'Driver',
    homeCity: '',
    verificationLevel: 'PhoneVerified' as 'PhoneVerified' | 'IDUploaded' | 'FullyVerified',
  });

  const loadUsers = useCallback(async () => {
    console.log('[AdminUsers] Loading users with filters:', { searchQuery, filterStatus });
    try {
      const response = await getAdminUsers({
        search: searchQuery || undefined,
        status: filterStatus,
        page: 1,
        limit: 100,
      });
      setUsers(response.users);
      console.log('[AdminUsers] Loaded users:', response.users.length);
    } catch (error: any) {
      console.error('[AdminUsers] Error loading users:', error);
      showModalMessage('Error', error.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleSearch = () => {
    setLoading(true);
    loadUsers();
  };

  const showModalMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  const handleUserPress = (user: AdminUser) => {
    console.log('[AdminUsers] User pressed:', user.id);
    router.push(`/admin/users/${user.id}` as any);
  };

  const handleBanUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('ban');
    setActionInput('');
    setShowActionModal(true);
  };

  const handleUnbanUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('unban');
    setShowActionModal(true);
  };

  const handleAdjustWallet = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('wallet');
    setActionInput('');
    setActionAmount('');
    setShowActionModal(true);
  };

  const handleViewOTP = async (user: AdminUser) => {
    console.log('[AdminUsers] Viewing OTP for user:', user.id);
    setActionLoading(true);
    try {
      const response = await getUserOTP(user.id);
      setOtpData(response);
      setShowOTPModal(true);
    } catch (error: any) {
      console.error('[AdminUsers] Error fetching OTP:', error);
      showModalMessage('Error', error.message || 'Failed to fetch OTP', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = () => {
    setActionType('create');
    setUserFormData({
      phoneNumber: '',
      fullName: '',
      email: '',
      userType: 'Passenger',
      homeCity: '',
      verificationLevel: 'PhoneVerified',
    });
    setShowUserFormModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('edit');
    setUserFormData({
      phoneNumber: user.phoneNumber,
      fullName: user.fullName || '',
      email: user.email || '',
      userType: (user.userType as 'Passenger' | 'Driver') || 'Passenger',
      homeCity: user.homeCity || '',
      verificationLevel: user.verificationLevel,
    });
    setShowUserFormModal(true);
  };

  const executeAction = async () => {
    if (!selectedUser && actionType !== 'create') return;

    setActionLoading(true);
    console.log('[AdminUsers] Executing action:', actionType);

    try {
      switch (actionType) {
        case 'ban':
          if (!actionInput.trim()) {
            showModalMessage('Error', 'Please provide a reason for banning', 'error');
            return;
          }
          await banUser(selectedUser!.id, actionInput);
          showModalMessage('Success', 'User banned successfully', 'success');
          break;

        case 'unban':
          await unbanUser(selectedUser!.id);
          showModalMessage('Success', 'User unbanned successfully', 'success');
          break;

        case 'wallet':
          const amount = parseFloat(actionAmount);
          if (isNaN(amount) || !actionInput.trim()) {
            showModalMessage('Error', 'Please provide valid amount and reason', 'error');
            return;
          }
          await adjustUserWallet(selectedUser!.id, amount, actionInput);
          showModalMessage('Success', 'Wallet balance adjusted successfully', 'success');
          break;

        case 'create':
          if (!userFormData.phoneNumber.trim()) {
            showModalMessage('Error', 'Phone number is required', 'error');
            return;
          }
          await createUser(userFormData);
          showModalMessage('Success', 'User created successfully', 'success');
          setShowUserFormModal(false);
          break;

        case 'edit':
          await updateUser(selectedUser!.id, {
            fullName: userFormData.fullName || undefined,
            email: userFormData.email || undefined,
            userType: userFormData.userType,
            homeCity: userFormData.homeCity || undefined,
            verificationLevel: userFormData.verificationLevel,
          });
          showModalMessage('Success', 'User updated successfully', 'success');
          setShowUserFormModal(false);
          break;
      }

      setShowActionModal(false);
      loadUsers();
    } catch (error: any) {
      console.error('[AdminUsers] Error executing action:', error);
      showModalMessage('Error', error.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formattedAmount = `$${amountNum.toFixed(2)}`;
    return formattedAmount;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString();
    return formattedDate;
  };

  const getActionModalTitle = () => {
    switch (actionType) {
      case 'ban': return 'Ban User';
      case 'unban': return 'Unban User';
      case 'wallet': return 'Adjust Wallet';
      default: return 'Action';
    }
  };

  const actionModalTitle = getActionModalTitle();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'User Management' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'User Management' }} />
      
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by phone or name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('active')}
          >
            <Text style={[styles.filterText, filterStatus === 'active' && styles.filterTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'banned' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('banned')}
          >
            <Text style={[styles.filterText, filterStatus === 'banned' && styles.filterTextActive]}>
              Banned
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          onPress={handleCreateUser}
          variant="primary"
          size="medium"
          style={styles.createButton}
        >
          Create User
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <TouchableOpacity onPress={() => handleUserPress(user)} style={styles.userInfo}>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{user.fullName || 'No Name'}</Text>
                {user.isBanned && (
                  <View style={styles.bannedBadge}>
                    <Text style={styles.bannedText}>BANNED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userPhone}>{user.phoneNumber}</Text>
              <View style={styles.userMeta}>
                <Text style={styles.userMetaText}>{user.userType || 'N/A'}</Text>
                <Text style={styles.userMetaText}>•</Text>
                <Text style={styles.userMetaText}>{user.verificationLevel}</Text>
                <Text style={styles.userMetaText}>•</Text>
                <Text style={styles.userMetaText}>{formatCurrency(user.walletBalance)}</Text>
              </View>
              <Text style={styles.userDate}>Joined {formatDate(user.createdAt)}</Text>
            </TouchableOpacity>

            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewOTP(user)}
              >
                <IconSymbol
                  ios_icon_name="key.fill"
                  android_material_icon_name="vpn-key"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditUser(user)}
              >
                <IconSymbol
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAdjustWallet(user)}
              >
                <IconSymbol
                  ios_icon_name="dollarsign.circle"
                  android_material_icon_name="account-balance-wallet"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              {user.isBanned ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleUnbanUser(user)}
                >
                  <IconSymbol
                    ios_icon_name="checkmark.circle"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.success}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleBanUser(user)}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle"
                    android_material_icon_name="block"
                    size={20}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {users.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{actionModalTitle}</Text>
            
            {actionType === 'ban' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Reason for banning..."
                placeholderTextColor={colors.textSecondary}
                value={actionInput}
                onChangeText={setActionInput}
                multiline
              />
            )}

            {actionType === 'wallet' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Amount (use negative for deduction)"
                  placeholderTextColor={colors.textSecondary}
                  value={actionAmount}
                  onChangeText={setActionAmount}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Reason for adjustment..."
                  placeholderTextColor={colors.textSecondary}
                  value={actionInput}
                  onChangeText={setActionInput}
                  multiline
                />
              </>
            )}

            {actionType === 'unban' && (
              <Text style={styles.modalText}>
                Are you sure you want to unban this user?
              </Text>
            )}

            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowActionModal(false)}
                variant="secondary"
                size="medium"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={executeAction}
                variant="primary"
                size="medium"
                loading={actionLoading}
                style={styles.modalButton}
              >
                Confirm
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Display Modal */}
      <Modal
        visible={showOTPModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOTPModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User OTP</Text>
            {otpData && (
              <>
                <View style={styles.otpContainer}>
                  <Text style={styles.otpCode}>{otpData.otp}</Text>
                </View>
                <Text style={styles.otpInfo}>Phone: {otpData.phoneNumber}</Text>
                <Text style={styles.otpInfo}>
                  Expires: {new Date(otpData.expiresAt).toLocaleString()}
                </Text>
                <Text style={styles.otpInfo}>Attempts: {otpData.attempts}/5</Text>
                <Text style={styles.otpInfo}>
                  Status: {otpData.verified ? 'Verified' : 'Pending'}
                </Text>
              </>
            )}
            <Button
              onPress={() => setShowOTPModal(false)}
              variant="primary"
              size="medium"
              style={styles.modalButtonFull}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      {/* User Form Modal */}
      <Modal
        visible={showUserFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.formModalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'create' ? 'Create User' : 'Edit User'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number (+263...)"
              placeholderTextColor={colors.textSecondary}
              value={userFormData.phoneNumber}
              onChangeText={(text) => setUserFormData({ ...userFormData, phoneNumber: text })}
              editable={actionType === 'create'}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={userFormData.fullName}
              onChangeText={(text) => setUserFormData({ ...userFormData, fullName: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={userFormData.email}
              onChangeText={(text) => setUserFormData({ ...userFormData, email: text })}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Home City"
              placeholderTextColor={colors.textSecondary}
              value={userFormData.homeCity}
              onChangeText={(text) => setUserFormData({ ...userFormData, homeCity: text })}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>User Type:</Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    userFormData.userType === 'Passenger' && styles.pickerButtonActive,
                  ]}
                  onPress={() => setUserFormData({ ...userFormData, userType: 'Passenger' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      userFormData.userType === 'Passenger' && styles.pickerButtonTextActive,
                    ]}
                  >
                    Passenger
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    userFormData.userType === 'Driver' && styles.pickerButtonActive,
                  ]}
                  onPress={() => setUserFormData({ ...userFormData, userType: 'Driver' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      userFormData.userType === 'Driver' && styles.pickerButtonTextActive,
                    ]}
                  >
                    Driver
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowUserFormModal(false)}
                variant="secondary"
                size="medium"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={executeAction}
                variant="primary"
                size="medium"
                loading={actionLoading}
                style={styles.modalButton}
              >
                {actionType === 'create' ? 'Create' : 'Update'}
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <CustomModal
        visible={showModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  bannedBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  formModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginVertical: 40,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    minHeight: 48,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonFull: {
    marginTop: 8,
  },
  otpContainer: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  otpCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  otpInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  pickerButtonActive: {
    backgroundColor: colors.primary,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pickerButtonTextActive: {
    color: '#FFFFFF',
  },
});
