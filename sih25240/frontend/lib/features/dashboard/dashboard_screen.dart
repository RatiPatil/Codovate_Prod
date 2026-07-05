import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SIH25240 Translator'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // TODO: Navigate to settings
            },
          )
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildDashboardCard(
                context, 
                title: 'Camera Scanner', 
                icon: Icons.camera_alt, 
                color: Colors.blue,
                onTap: () => context.push('/scanner'),
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context, 
                title: 'Translate Image', 
                icon: Icons.image, 
                color: Colors.green,
                onTap: () => context.push('/translation'),
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context, 
                title: 'Translate PDF', 
                icon: Icons.picture_as_pdf, 
                color: Colors.red,
                onTap: () => context.push('/translation'),
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context, 
                title: 'History & Saved', 
                icon: Icons.history, 
                color: Colors.orange,
                onTap: () {}
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDashboardCard(BuildContext context, {required String title, required IconData icon, required Color color, required VoidCallback onTap}) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: color.withOpacity(0.1),
                radius: 28,
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward_ios, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
