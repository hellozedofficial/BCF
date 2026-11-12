class UmpireProfile {
  final int id;
  final String? umpireId;
  final String name;
  final String? grade;
  final String? status;
  final String? photoUrl;

  const UmpireProfile({
    required this.id,
    this.umpireId,
    required this.name,
    this.grade,
    this.status,
    this.photoUrl,
  });

  factory UmpireProfile.fromJson(Map<String, dynamic> json) {
    return UmpireProfile(
      id: (json['id'] as num?)?.toInt() ?? 0,
      umpireId: json['umpire_id']?.toString(),
      name: json['name']?.toString() ?? '',
      grade: json['grade']?.toString(),
      status: json['status']?.toString(),
      photoUrl: json['photo_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'umpire_id': umpireId,
    'name': name,
    'grade': grade,
    'status': status,
    'photo_url': photoUrl,
  };
}

class AdminUser {
  final int id;
  final String email;
  final String name;
  final String role;
  final String status;
  final String? avatarUrl;
  final String? designation;
  final String? phone;
  final bool umpireAccessOnly;
  final UmpireProfile? umpireProfile;

  const AdminUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.status = 'Active',
    this.avatarUrl,
    this.designation,
    this.phone,
    this.umpireAccessOnly = false,
    this.umpireProfile,
  });

  bool get isSuperAdmin => role.toLowerCase() == 'super admin';
  bool get isAdmin => role.toLowerCase() == 'admin' || isSuperAdmin;
  bool get isUmpireOnly =>
      umpireAccessOnly || role.toLowerCase() == 'umpire';

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    final rawUmpire = json['umpire_profile'];
    return AdminUser(
      id: (json['id'] as num?)?.toInt() ?? 0,
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Admin',
      role: json['role']?.toString() ?? 'Admin',
      status: json['status']?.toString() ?? 'Active',
      avatarUrl: json['avatar_url']?.toString(),
      designation: json['designation']?.toString(),
      phone: json['phone']?.toString(),
      umpireAccessOnly:
          json['umpire_access_only'] == true ||
          json['umpire_access_only'] == 1 ||
          json['umpire_access_only']?.toString() == 'true',
      umpireProfile: rawUmpire is Map<String, dynamic>
          ? UmpireProfile.fromJson(rawUmpire)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'role': role,
    'status': status,
    'avatar_url': avatarUrl,
    'designation': designation,
    'phone': phone,
    'umpire_access_only': umpireAccessOnly,
    if (umpireProfile != null) 'umpire_profile': umpireProfile!.toJson(),
  };
}

