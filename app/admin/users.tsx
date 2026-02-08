
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getAdminUsers, banUser, unbanUser, adjustUserWallet } from '@/utils/adminApi';
import type { AdminUser } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'driver' | 'passenger'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);
  
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'wallet' | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const loadUsers = async () => {
    console.log('Loading admin users');
    try {
      const response = await getAdminUsers({
        search: searchQuery || undefined,
        page,
        limit: 20,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      showModal('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadUsers();
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const showModal = (title: string, message: string, action?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalVisible(true);
  };

  const handleUserPress = (user: AdminUser) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleBanUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('ban');
    setBanReason('');
    setActionModalVisible(true);
  };

  const handleUnbanUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('unban');
    setActionModalVisible(true);
  };

  const handleAdjustWallet = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('wallet');
    setWalletAmount('');
    setWalletReason('');
    setActionModalVisible(true);
  };

  const executeAction = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === 'ban') {
        if (!banReason.trim()) {
          showModal('Error', 'Please provide a reason for banning this user');
          return;
        }
        await banUser(selectedUser.id, banReason);
        showModal('Success', 'User has been banned');
      } else if (actionType === 'unban') {
        await unbanUser(selectedUser.id);
        showModal('Success', 'User has been unbanned');
      } else if (actionType === 'wallet') {
        const amount = parseFloat(walletAmount);
        if (isNaN(amount) || amount === 0) {
          showModal('Error', 'Please enter a valid amount');
          return;
        }
        if (!walletReason.trim()) {
          showModal('Error', 'Please provide a reason for the adjustment');
          return;
        }
        await adjustUserWallet(selectedUser.id, amount, walletReason);
        showModal('Success', 'Wallet balance has been adjusted');
      }
      
      setActionModalVisible(false);
      loadUsers();
    } catch (error: any) {
      console.error('Action failed:', error);
      showModal('Error', error.message || 'Action failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'User Management', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'User Management', headerShown: true }} />
      
      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
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

        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, roleFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setRoleFilter('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  roleFilter === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, roleFilter === 'driver' && styles.filterButtonActive]}
              onPress={() => setRoleFilter('driver')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  roleFilter === 'driver' && styles.filterButtonTextActive,
                ]}
              >
                Drivers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, roleFilter === 'passenger' && styles.filterButtonActive]}
              onPress={() => setRoleFilter('passenger')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  roleFilter === 'passenger' && styles.filterButtonTextActive,
                ]}
              >
                Passengers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'active' && styles.filterButtonActive]}
              onPress={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === 'active' && styles.filterButtonTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'banned' && styles.filterButtonActive]}
              onPress={() => setStatusFilter(statusFilter === 'banned' ? 'all' : 'banned')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === 'banned' && styles.filterButtonTextActive,
                ]}
              >
                Banned
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.usersList}>
          {users.map((user) => {
            const fullName = user.fullName || 'No name';
            const phoneNumber = user.phoneNumber;
            const userType = user.userType || 'N/A';
            const walletBalance = formatCurrency(user.walletBalance);
            const isBanned = user.isBanned;
            const createdDate = formatDate(user.createdAt);

            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.userCard, isBanned && styles.userCardBanned]}
                onPress={() => handleUserPress(user)}
              >
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{fullName}</Text>
                    <Text style={styles.userPhone}>{phoneNumber}</Text>
                  </View>
                  {isBanned && (
                    <View style={styles.bannedBadge}>
                      <Text style={styles.bannedBadgeText}>BANNED</Text>
                    </View>
                  )}
                </View>

                <View style={styles.userDetails}>
                  <View style={styles.userDetailItem}>
                    <Text style={styles.userDetailLabel}>Type:</Text>
                    <Text style={styles.userDetailValue}>{userType}</Text>
                  </View>
                  <View style={styles.userDetailItem}>
                    <Text style={styles.userDetailLabel}>Wallet:</Text>
                    <Text style={styles.userDetailValue}>{walletBalance}</Text>
                  </View>
                  <View style={styles.userDetailItem}>
                    <Text style={styles.userDetailLabel}>Joined:</Text>
                    <Text style={styles.userDetailValue}>{createdDate}</Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  {!isBanned ? (
                    <>
                      <TouchableOpacity
                        style={styles.actionButtonSmall}
                        onPress={() => handleAdjustWallet(user)}
                      >
                        <IconSymbol
                          ios_icon_name="dollarsign.circle"
                          android_material_icon_name="attach-money"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.actionButtonSmallText}>Wallet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButtonSmall, styles.actionButtonDanger]}
                        onPress={() => handleBanUser(user)}
                      >
                        <IconSymbol
                          ios_icon_name="xmark.circle"
                          android_material_icon_name="block"
                          size={16}
                          color={colors.danger}
                        />
                        <Text style={[styles.actionButtonSmallText, styles.actionButtonDangerText]}>
                          Ban
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButtonSmall, styles.actionButtonSuccess]}
                      onPress={() => handleUnbanUser(user)}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark.circle"
                        android_material_icon_name="check-circle"
                        size={16}
                        color={colors.success}
                      />
                      <Text style={[styles.actionButtonSmallText, styles.actionButtonSuccessText]}>
                        Unban
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            onPress={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <Text style={styles.paginationButtonText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {page} of {Math.ceil(total / 20)}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page >= Math.ceil(total / 20) && styles.paginationButtonDisabled,
            ]}
            onPress={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            <Text style={styles.paginationButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Modal */}
      <CustomModal
        visible={actionModalVisible}
        title={
          actionType === 'ban'
            ? 'Ban User'
            : actionType === 'unban'
            ? 'Unban User'
            : 'Adjust Wallet'
        }
        message=""
        onCancel={() => setActionModalVisible(false)}
        onConfirm={executeAction}
        confirmText={actionType === 'unban' ? 'Unban' : 'Confirm'}
        cancelText="Cancel"
      >
        {actionType === 'ban' && (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Reason for banning:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason..."
              placeholderTextColor={colors.textSecondary}
              value={banReason}
              onChangeText={setBanReason}
              multiline
              numberOfLines={3}
            />
          </View>
        )}
        {actionType === 'unban' && (
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Are you sure you want to unban {selectedUser?.fullName || 'this user'}?
            </Text>
          </View>
        )}
        {actionType === 'wallet' && (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Amount (use negative for deduction):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 10.00 or -5.00"
              placeholderTextColor={colors.textSecondary}
              value={walletAmount}
              onChangeText={setWalletAmount}
              keyboardType="numeric"
            />
            <Text style={styles.modalLabel}>Reason:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason..."
              placeholderTextColor={colors.textSecondary}
              value={walletReason}
              onChangeText={setWalletReason}
              multiline
              numberOfLines={2}
            />
          </View>
        )}
      </CustomModal>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => {
          setModalVisible(false);
          if (modalAction) modalAction();
        }}
        confirmText="OK"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  filters: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  usersList: {
    padding: 16,
  },
  userCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userCardBanned: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bannedBadge: {
    backgroundColor: colors.danger,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bannedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userDetailItem: {
    flex: 1,
  },
  userDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userDetailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginLeft: 8,
  },
  actionButtonDanger: {
    backgroundColor: colors.backgroundAlt,
  },
  actionButtonSuccess: {
    backgroundColor: colors.backgroundAlt,
  },
  actionButtonSmallText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  actionButtonDangerText: {
    color: colors.danger,
  },
  actionButtonSuccessText: {
    color: colors.success,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.backgroundAlt,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});
