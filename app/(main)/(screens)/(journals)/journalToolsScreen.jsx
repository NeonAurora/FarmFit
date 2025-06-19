// app/(main)/(screens)/(journals)/journalToolsScreen.jsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { 
  Card, 
  Text, 
  List, 
  Divider,
  IconButton,
  useTheme
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function JournalToolsScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { user } = useAuth();
  const isDark = colorScheme === 'dark';

  const navigateTo = (route) => {
    router.push(route);
  };

  const toolCategories = [
    {
      title: "📊 Analytics & Insights",
      description: "Track your journaling patterns and pet health trends",
      items: [
        {
          title: "Journal Statistics",
          description: "View your journaling habits and streaks",
          icon: "chart-bar",
          route: "/journalStatsScreen",
          color: "#3498DB"
        },
        {
          title: "Mood Analytics",
          description: "Track your pet's mood patterns over time",
          icon: "emoticon-happy",
          route: "/moodAnalyticsScreen",
          color: "#9B59B6"
        },
        {
          title: "Health Trends", 
          description: "Visualize health patterns and improvements",
          icon: "trending-up",
          route: "/healthTrendsScreen",
          color: "#27AE60"
        }
      ]
    },
    {
      title: "🔍 Search & Discovery",
      description: "Find and explore your journal entries",
      items: [
        {
          title: "Advanced Search",
          description: "Search entries by date, mood, tags, or content",
          icon: "magnify",
          route: "/journalSearchScreen",
          color: "#E67E22"
        },
        {
          title: "Memory Lane",
          description: "Rediscover entries from this day in previous years",
          icon: "history",
          route: "/memoryLaneScreen", 
          color: "#E91E63"
        },
        {
          title: "Tag Explorer",
          description: "Browse entries by tags and categories",
          icon: "tag-multiple",
          route: "/tagExplorerScreen",
          color: "#FF5722"
        }
      ]
    },
    {
      title: "⚙️ Settings & Customization",
      description: "Personalize your journaling experience",
      items: [
        {
          title: "Journal Settings",
          description: "Configure privacy, reminders, and preferences",
          icon: "cog",
          route: "/journalSettingsScreen",
          color: "#607D8B"
        },
        {
          title: "Export & Backup",
          description: "Download or backup your journal data",
          icon: "download",
          route: "/journalExportScreen",
          color: "#795548"
        },
        {
          title: "Templates & Prompts",
          description: "Manage custom templates and writing prompts",
          icon: "file-document-edit",
          route: "/journalTemplatesScreen",
          color: "#009688"
        }
      ]
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header Card */}
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Journal Tools
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Enhance your journaling experience with powerful tools and insights
            </Text>
          </Card.Content>
        </Card>

        {/* Quick Actions Row */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <View style={styles.quickAction}>
                <IconButton
                  icon="plus-circle"
                  size={40}
                  iconColor="#27AE60"
                  style={[styles.quickActionButton, { backgroundColor: '#27AE6020' }]}
                  onPress={() => navigateTo('/addJournalScreen')}
                />
                <Text variant="bodySmall" style={styles.quickActionText}>New Entry</Text>
              </View>
              <View style={styles.quickAction}>
                <IconButton
                  icon="view-list"
                  size={40}
                  iconColor="#3498DB"
                  style={[styles.quickActionButton, { backgroundColor: '#3498DB20' }]}
                  onPress={() => navigateTo('/journalListScreen')}
                />
                <Text variant="bodySmall" style={styles.quickActionText}>All Entries</Text>
              </View>
              <View style={styles.quickAction}>
                <IconButton
                  icon="calendar-today"
                  size={40}
                  iconColor="#E67E22"
                  style={[styles.quickActionButton, { backgroundColor: '#E67E2220' }]}
                  onPress={() => navigateTo('/journalCalendarScreen')}
                />
                <Text variant="bodySmall" style={styles.quickActionText}>Calendar</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tool Categories */}
        {toolCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex} style={styles.categoryCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.categoryTitle}>
                {category.title}
              </Text>
              <Text variant="bodyMedium" style={styles.categoryDescription}>
                {category.description}
              </Text>
              
              <Divider style={styles.categoryDivider} />
              
              {category.items.map((item, itemIndex) => (
                <List.Item
                  key={itemIndex}
                  title={item.title}
                  description={item.description}
                  left={(props) => (
                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                      <List.Icon 
                        {...props} 
                        icon={item.icon} 
                        color={item.color}
                      />
                    </View>
                  )}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => navigateTo(item.route)}
                  style={styles.toolItem}
                />
              ))}
            </Card.Content>
          </Card>
        ))}

        {/* Usage Tips Card */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.tipsTitle}>
              💡 Pro Tips
            </Text>
            <View style={styles.tipsList}>
              <Text variant="bodyMedium" style={styles.tipItem}>
                • Use tags consistently to make searching easier
              </Text>
              <Text variant="bodyMedium" style={styles.tipItem}>
                • Check your stats weekly to maintain journaling habits
              </Text>
              <Text variant="bodyMedium" style={styles.tipItem}>
                • Set up reminders in Settings for consistent entries
              </Text>
              <Text variant="bodyMedium" style={styles.tipItem}>
                • Export your data regularly as a backup
              </Text>
            </View>
          </Card.Content>
        </Card>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  quickActionsCard: {
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionButton: {
    marginBottom: 8,
  },
  quickActionText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryCard: {
    marginBottom: 16,
    elevation: 1,
  },
  categoryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryDescription: {
    opacity: 0.7,
    marginBottom: 16,
  },
  categoryDivider: {
    marginBottom: 8,
  },
  iconContainer: {
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolItem: {
    paddingVertical: 4,
  },
  tipsCard: {
    marginBottom: 32,
    elevation: 1,
  },
  tipsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipsList: {
    paddingLeft: 8,
  },
  tipItem: {
    marginBottom: 6,
    lineHeight: 20,
  },
});