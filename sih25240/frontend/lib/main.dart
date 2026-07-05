import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/app_router.dart';
import 'core/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: TranslatorApp()));
}

class TranslatorApp extends ConsumerWidget {
  const TranslatorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'SIH25240 Translator',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Auto detect based on OS
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
