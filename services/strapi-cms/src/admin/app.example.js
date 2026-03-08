'use strict';

/**
 * Default roles assumed before init.
 */
const BOOTSTRAP_CUSTOM_ROLES = [
  {
    name: 'Strapi Super Admin',
    code: 'strapi-super-admin',
    description: 'Super Admins can access and manage all features and settings.',
  },
  {
    name: 'Editor',
    code: 'editor',
    description: 'Editors can create, edit and publish content.',
  },
  {
    name: 'Author',
    code: 'author',
    description: 'Authors can create and edit content, but cannot publish.',
  },
];

module.exports = async () => {
  await strapi.admin.services.role.createMany(BOOTSTRAP_CUSTOM_ROLES);
};
