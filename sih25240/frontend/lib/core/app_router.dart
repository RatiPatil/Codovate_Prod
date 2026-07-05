import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/translation/translation_screen.dart';
import '../features/ocr/camera_scanner_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/translation',
        builder: (context, state) => const TranslationScreen(),
      ),
      GoRoute(
        path: '/scanner',
        builder: (context, state) => const CameraScannerScreen(),
      ),
    ],
  );
});
