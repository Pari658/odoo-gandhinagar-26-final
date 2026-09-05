import bcrypt from 'bcryptjs';
import { inMemoryStore, query } from '../db/index.js';

export async function getContacts(req, res) {
  const { type, page = 1, pageSize = 20, search } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limit = parseInt(pageSize, 10) || 20;

  let items = [...inMemoryStore.contacts];

  if (type) {
    items = items.filter(c => c.type === type || c.type === 'both');
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  }

  const totalCount = items.length;
  const paginated = items.slice((pageNum - 1) * limit, pageNum * limit).map(c => ({
    id: c.id,
    userId: c.user_id || null,
    name: c.name,
    type: c.type,
    email: c.email || null,
    mobile: c.mobile || null,
    city: c.city || null,
    state: c.state || null,
    pincode: c.pincode || null,
    profileImageUrl: c.profile_image_url || null,
    isArchived: Boolean(c.is_archived),
    createdAt: c.created_at
  }));

  return res.json({
    success: true,
    data: {
      items: paginated,
      page: pageNum,
      pageSize: limit,
      totalCount
    },
    error: null
  });
}

export async function getContactById(req, res) {
  const { id } = req.params;
  const contact = inMemoryStore.contacts.find(c => c.id === id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: `Contact with ID '${id}' not found`
      }
    });
  }

  return res.json({
    success: true,
    data: {
      id: contact.id,
      userId: contact.user_id || null,
      name: contact.name,
      type: contact.type,
      email: contact.email || null,
      mobile: contact.mobile || null,
      city: contact.city || null,
      state: contact.state || null,
      pincode: contact.pincode || null,
      profileImageUrl: contact.profile_image_url || null,
      isArchived: Boolean(contact.is_archived),
      createdAt: contact.created_at
    },
    error: null
  });
}

export async function createContact(req, res) {
  const { name, type, email, mobile, city, state, pincode, profileImageUrl } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name and type (customer/vendor/both) are required fields',
        field: !name ? 'name' : 'type'
      }
    });
  }

  const newId = `c-${Date.now().toString().slice(-4)}`;
  let provisionedUserId = null;

  if (email) {
    const existingUser = inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existingUser) {
      const newUserId = `u-${Date.now().toString().slice(-4)}`;
      const newUser = {
        id: newUserId,
        email: email,
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'contact',
        contact_id: newId,
        is_active: true,
        created_at: new Date().toISOString()
      };
      inMemoryStore.users.push(newUser);
      provisionedUserId = newUserId;
    } else {
      provisionedUserId = existingUser.id;
    }
  }

  const newContact = {
    id: newId,
    user_id: provisionedUserId,
    name,
    type,
    email: email || null,
    mobile: mobile || null,
    city: city || null,
    state: state || null,
    pincode: pincode || null,
    profile_image_url: profileImageUrl || null,
    is_archived: false,
    created_at: new Date().toISOString()
  };

  inMemoryStore.contacts.unshift(newContact);

  return res.status(201).json({
    success: true,
    data: {
      id: newContact.id,
      userId: newContact.user_id,
      name: newContact.name,
      type: newContact.type,
      email: newContact.email,
      mobile: newContact.mobile,
      city: newContact.city,
      state: newContact.state,
      pincode: newContact.pincode,
      profileImageUrl: newContact.profile_image_url,
      isArchived: false,
      autoProvisionedUser: Boolean(provisionedUserId),
      createdAt: newContact.created_at
    },
    error: null
  });
}

export async function updateContact(req, res) {
  const { id } = req.params;
  const index = inMemoryStore.contacts.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: `Contact with ID '${id}' not found`
      }
    });
  }

  const existing = inMemoryStore.contacts[index];
  const updated = {
    ...existing,
    ...req.body,
    profile_image_url: req.body.profileImageUrl !== undefined ? req.body.profileImageUrl : existing.profile_image_url
  };

  inMemoryStore.contacts[index] = updated;

  return res.json({
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      email: updated.email,
      mobile: updated.mobile,
      city: updated.city,
      state: updated.state,
      pincode: updated.pincode,
      profileImageUrl: updated.profile_image_url,
      isArchived: updated.is_archived
    },
    error: null
  });
}

export async function archiveContact(req, res) {
  const { id } = req.params;
  const contact = inMemoryStore.contacts.find(c => c.id === id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: `Contact with ID '${id}' not found`
      }
    });
  }

  contact.is_archived = !contact.is_archived;

  return res.json({
    success: true,
    data: {
      id: contact.id,
      isArchived: contact.is_archived
    },
    error: null
  });
}
