import React from 'react';
import { ScrollView, RefreshControl, ScrollViewProps } from 'react-native';
import { Colors } from '../constants/theme';

interface RefreshableScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

export const RefreshableScrollView = React.forwardRef<ScrollView, RefreshableScrollViewProps>(
  ({ refreshing, onRefresh, children, ...props }, ref) => {
    return (
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            title="Pull to refresh"
            titleColor={Colors.textSecondary}
          />
        }
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
);

RefreshableScrollView.displayName = 'RefreshableScrollView';
