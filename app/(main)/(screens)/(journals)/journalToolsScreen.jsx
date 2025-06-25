// app/(main)/(screens)/(journals)/journalToolsScreen.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { 
  List, 
  IconButton,
  Chip
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { BrandColors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function JournalToolsScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Expandable sections state
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  const navigateTo = (route) => {
    router.push(route);
  };

  const showHint = (title, description) => {
    Alert.alert(title, description, [{ text: "Got it", style: "default" }]);
  };

  const quickActions = [
    {
      title: "New Entry",
      description: "Create a new journal entry to document your day",
      icon: "plus",
      route: "/addJournalScreen",
      color: BrandColors.primary
    },
    {
      title: "All Entries",
      description: "View and manage all your journal entries",
      icon: "format-list-bulleted",
      route: "/journalListScreen",
      color: BrandColors.primary
    },
    {
      title: "Calendar",
      description: "View your entries in a calendar format",
      icon: "calendar",
      route: "/journalCalendarScreen",
      color: BrandColors.primary
    }
  ];

  const toolCategories = [
    {
      title: "Analytics & Insights",
      expanded: analyticsExpanded,
      setExpanded: setAnalyticsExpanded,
      items: [
        {
          title: "Journal Statistics",
          description: "View your journaling habits, streaks, and writing patterns over time",
          icon: "chart-bar",
          route: "/journalStatsScreen"
        },
        {
          title: "Mood Analytics", 
          description: "Track mood patterns and emotional trends for you and your pets",
          icon: "chart-line",
          route: "/moodAnalyticsScreen"
        },
        {
          title: "Health Trends",
          description: "Visualize health patterns and improvements based on your entries",
          icon: "trending-up",
          route: "/healthTrendsScreen"
        }
      ]
    },
    {
      title: "Search & Discovery",
      expanded: searchExpanded,
      setExpanded: setSearchExpanded,
      items: [
        {
          title: "Advanced Search",
          description: "Search entries by date, mood, tags, content, or specific keywords",
          icon: "magnify",
          route: "/journalSearchScreen"
        },
        {
          title: "Memory Lane",
          description: "Rediscover entries from this day in previous years and relive memories",
          icon: "history",
          route: "/memoryLaneScreen"
        },
        {
          title: "Tag Explorer",
          description: "Browse and explore your entries organized by tags and categories",
          icon: "tag-multiple",
          route: "/tagExplorerScreen"
        }
      ]
    },
    {
      title: "Settings & Export",
      expanded: settingsExpanded,
      setExpanded: setSettingsExpanded,
      items: [
        {
          title: "Journal Settings",
          description: "Configure privacy settings, reminders, and personal preferences",
          icon: "cog",
          route: "/journalSettingsScreen"
        },
        {
          title: "Export & Backup",
          description: "Download, backup, or share your journal data securely",
          icon: "download",
          route: "/journalExportScreen"
        },
        {
          title: "Templates & Prompts",
          description: "Create and manage custom templates and writing prompts",
          icon: "file-document-edit",
          route: "/journalTemplatesScreen"
        }
      ]
    }
  ];

  const proTips = [
    {
      title: "Use Tags Consistently",
      description: "Consistent tagging makes searching and organizing entries much easier",
      icon: "tag"
    },
    {
      title: "Check Stats Weekly",
      description: "Regular review of your statistics helps maintain journaling habits",
      icon: "chart-line"
    },
    {
      title: "Set Up Reminders",
      description: "Daily reminders help you build and maintain consistent journaling habits",
      icon: "bell"
    },
    {
      title: "Export Data Regularly",
      description: "Regular backups protect your valuable journal entries from loss",
      icon: "download"
    }
  ];

  const renderQuickAction = (action, index) => (
    <TouchableOpacity
      key={index}
      style={styles.quickAction}
      onPress={() => navigateTo(action.route)}
      onLongPress={() => showHint(action.title, action.description)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.quickActionButton, 
        { backgroundColor: colors.surface }
      ]}>
        <IconButton
          icon={action.icon}
          size={24}
          iconColor={action.color}
          style={styles.quickActionIcon}
        />
      </View>
      <ThemedText style={styles.quickActionText}>{action.title}</ThemedText>
    </TouchableOpacity>
  );

  const renderToolItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.toolItem, { borderBottomColor: colors.border }]}
      onPress={() => navigateTo(item.route)}
      onLongPress={() => showHint(item.title, item.description)}
      activeOpacity={0.7}
    >
      <View style={styles.toolItemContent}>
        <View style={[styles.toolIconContainer, { backgroundColor: colors.surface }]}>
          <IconButton
            icon={item.icon}
            size={20}
            iconColor={colors.text}
            style={styles.toolIcon}
          />
        </View>
        
        <View style={styles.toolTextContainer}>
          <ThemedText style={styles.toolTitle}>{item.title}</ThemedText>
        </View>
        
        <IconButton
          icon="chevron-right"
          size={18}
          iconColor={colors.textSecondary}
          style={styles.chevronIcon}
        />
      </View>
    </TouchableOpacity>
  );

  const renderProTip = (tip, index) => (
    <TouchableOpacity
      key={index}
      onLongPress={() => showHint(tip.title, tip.description)}
      activeOpacity={0.7}
    >
      <Chip
        icon={tip.icon}
        style={[styles.tipChip, { backgroundColor: colors.surface }]}
        textStyle={[styles.tipText, { color: colors.textSecondary }]}
      >
        {tip.title}
      </Chip>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction Card */}
        <ThemedCard variant="elevated" style={styles.introCard}>
          <View style={styles.cardContent}>
            <ThemedText style={styles.introText}>
              Enhance your journaling experience with powerful tools and insights
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Quick Actions */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            <View style={styles.quickActionsRow}>
              {quickActions.map(renderQuickAction)}
            </View>
          </View>
        </ThemedCard>

        {/* Tool Categories - Expandable Sections */}
        {toolCategories.map((category, categoryIndex) => (
          <ThemedCard key={categoryIndex} variant="elevated" style={styles.card}>
            <List.Accordion
              title={category.title}
              expanded={category.expanded}
              onPress={() => category.setExpanded(!category.expanded)}
              style={styles.accordion}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
              left={props => <List.Icon {...props} icon="chevron-down" />}
            >
              <View style={styles.accordionContent}>
                <View style={styles.toolsList}>
                  {category.items.map(renderToolItem)}
                </View>
              </View>
            </List.Accordion>
          </ThemedCard>
        ))}

        {/* Pro Tips - Expandable Section */}
        <ThemedCard variant="elevated" style={styles.card}>
          <List.Accordion
            title="Pro Tips"
            expanded={tipsExpanded}
            onPress={() => setTipsExpanded(!tipsExpanded)}
            style={styles.accordion}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
            left={props => <List.Icon {...props} icon="chevron-down" />}
          >
            <View style={styles.accordionContent}>
              <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
                Long press any button to see its functionality
              </ThemedText>
              
              <View style={styles.tipsContainer}>
                {proTips.map(renderProTip)}
              </View>
            </View>
          </List.Accordion>
        </ThemedCard>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    marginBottom: 20,
    elevation: 2,
  },
  card: {
    marginBottom: 20,
    elevation: 1,
  },
  cardContent: {
    padding: 20,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#666',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  quickActionIcon: {
    margin: 0,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  accordion: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 18,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  toolsList: {
    gap: 2,
  },
  toolItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  toolItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolIcon: {
    margin: 0,
  },
  toolTextContainer: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  chevronIcon: {
    margin: 0,
    width: 32,
    height: 32,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipChip: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '500',
  },
});