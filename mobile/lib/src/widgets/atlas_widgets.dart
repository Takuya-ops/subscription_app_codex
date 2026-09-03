import 'package:flutter/material.dart';

import '../domain/ui_pattern.dart';
import '../theme/app_theme.dart';

class AtlasBrand extends StatelessWidget {
  const AtlasBrand({this.compact = false, super.key});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final largeText = MediaQuery.textScalerOf(context).scale(14) > 17;
    return Semantics(
      label: 'UI Atlas',
      header: true,
      child: Row(
        mainAxisSize: MainAxisSize.max,
        children: [
          Container(
            width: compact ? 38 : 46,
            height: compact ? 38 : 46,
            decoration: BoxDecoration(
              color: AtlasColors.ink,
              borderRadius: BorderRadius.circular(compact ? 12 : 15),
            ),
            padding: const EdgeInsets.all(9),
            child: const _AtlasGlyph(),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: ExcludeSemantics(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'UI Atlas',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AtlasColors.ink,
                      fontSize: compact ? 19 : 23,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.7,
                    ),
                  ),
                  if (!compact && !largeText)
                    const Text(
                      'INTERACTION FIELD GUIDE',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AtlasColors.muted,
                        fontSize: 8,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AtlasGlyph extends StatelessWidget {
  const _AtlasGlyph();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Align(
          alignment: Alignment.topLeft,
          child: Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: AtlasColors.acid,
              borderRadius: BorderRadius.circular(5),
            ),
          ),
        ),
        Align(
          alignment: Alignment.bottomRight,
          child: Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 2),
              borderRadius: BorderRadius.circular(5),
            ),
          ),
        ),
      ],
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: AtlasColors.blue,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.3,
      ),
    );
  }
}

class PlatformPill extends StatelessWidget {
  const PlatformPill({required this.platform, super.key});

  final PlatformScope platform;

  @override
  Widget build(BuildContext context) {
    final (label, background, foreground) = switch (platform) {
      PlatformScope.web => (
        'WEB',
        const Color(0xFFE8EEFF),
        AtlasColors.blueDark,
      ),
      PlatformScope.mobile => (
        'スマホ',
        const Color(0xFFE4F7EF),
        AtlasColors.success,
      ),
      PlatformScope.shared => (
        '共通',
        const Color(0xFFF0F2F6),
        AtlasColors.muted,
      ),
    };
    return Semantics(
      label: '対象: $label',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: foreground,
            fontSize: 11,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class AtlasEmptyState extends StatelessWidget {
  const AtlasEmptyState({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                color: const Color(0xFFE8EDFA),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(icon, color: AtlasColors.blue, size: 31),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

class InfoCard extends StatelessWidget {
  const InfoCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.tone,
    super.key,
  });

  final IconData icon;
  final String title;
  final String text;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: tone.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: tone, size: 21),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 7),
                  Text(text, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProgressOverview extends StatelessWidget {
  const ProgressOverview({
    required this.completed,
    required this.total,
    super.key,
  });

  final int completed;
  final int total;

  @override
  Widget build(BuildContext context) {
    final value = total == 0 ? 0.0 : completed / total;
    final percent = (value * 100).round();
    return Semantics(
      label: 'この端末の学習進捗、$total件中$completed件、$percentパーセント',
      child: Container(
        decoration: BoxDecoration(
          color: AtlasColors.ink,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1F15213D),
              blurRadius: 24,
              offset: Offset(0, 10),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'この端末の進捗',
                    style: TextStyle(
                      color: Color(0xFFBFC9DD),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  '$completed / $total',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: ExcludeSemantics(
                child: LinearProgressIndicator(
                  value: value,
                  minHeight: 9,
                  color: AtlasColors.acid,
                  backgroundColor: const Color(0xFF33405D),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PatternTile extends StatelessWidget {
  const PatternTile({
    required this.pattern,
    required this.index,
    required this.completed,
    required this.favorite,
    required this.onOpen,
    required this.onToggleFavorite,
    super.key,
  });

  final UiPattern pattern;
  final int index;
  final bool completed;
  final bool favorite;
  final VoidCallback onOpen;
  final VoidCallback onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              button: true,
              label:
                  '${pattern.name}、${pattern.english}、${pattern.platform.label}${completed ? '、学習済み' : ''}',
              child: InkWell(
                onTap: onOpen,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 15, 8, 15),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: completed
                              ? const Color(0xFFE3F7EF)
                              : const Color(0xFFF0F3F8),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: completed
                            ? const Icon(
                                Icons.check_rounded,
                                color: AtlasColors.success,
                                size: 21,
                              )
                            : Text(
                                '${index + 1}'.padLeft(2, '0'),
                                style: const TextStyle(
                                  color: AtlasColors.muted,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                      ),
                      const SizedBox(width: 13),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              pattern.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              pattern.english,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AtlasColors.muted,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 9),
                            Row(
                              children: [
                                PlatformPill(platform: pattern.platform),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: Text(
                                    pattern.category.shortLabel,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AtlasColors.muted,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF9AA5B8),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          IconButton(
            onPressed: onToggleFavorite,
            constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
            tooltip: favorite ? 'お気に入りから外す' : 'お気に入りに追加',
            isSelected: favorite,
            selectedIcon: const Icon(
              Icons.bookmark_rounded,
              color: AtlasColors.blue,
            ),
            icon: const Icon(
              Icons.bookmark_border_rounded,
              color: AtlasColors.muted,
            ),
          ),
          const SizedBox(width: 5),
        ],
      ),
    );
  }
}
