import { prisma } from '@/lib/prisma';

/**
 * Service for creating and managing notifications
 */
export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const { userId, type, title, message, data } = params;

    return await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        user: {
          connect: { id: userId }
        }
      }
    });
  },

  /**
   * Create a notification for a new proposal
   */
  async notifyNewProposal(params: {
    requestId: string;
    requestTitle: string;
    proposalId: string;
    providerId: string;
    providerName: string;
    clientId: string;
  }) {
    const { requestId, requestTitle, proposalId, providerId, providerName, clientId } = params;

    return await this.createNotification({
      userId: clientId,
      type: 'NEW_PROPOSAL',
      title: 'New Proposal Received',
      message: `${providerName} has submitted a proposal for your request: ${requestTitle}`,
      data: {
        requestId,
        proposalId,
        providerId
      }
    });
  },

  /**
   * Create a notification for an accepted proposal
   */
  async notifyProposalAccepted(params: {
    requestId: string;
    requestTitle: string;
    proposalId: string;
    clientId: string;
    clientName: string;
    providerId: string;
  }) {
    const { requestId, requestTitle, proposalId, clientId, clientName, providerId } = params;

    return await this.createNotification({
      userId: providerId,
      type: 'PROPOSAL_ACCEPTED',
      title: 'Proposal Accepted',
      message: `${clientName} has accepted your proposal for: ${requestTitle}`,
      data: {
        requestId,
        proposalId,
        clientId
      }
    });
  },

  /**
   * Create a notification for a rejected proposal
   */
  async notifyProposalRejected(params: {
    requestId: string;
    requestTitle: string;
    proposalId: string;
    clientId: string;
    clientName: string;
    providerId: string;
  }) {
    const { requestId, requestTitle, proposalId, clientId, clientName, providerId } = params;

    return await this.createNotification({
      userId: providerId,
      type: 'PROPOSAL_REJECTED',
      title: 'Proposal Rejected',
      message: `${clientName} has rejected your proposal for: ${requestTitle}`,
      data: {
        requestId,
        proposalId,
        clientId
      }
    });
  },

  /**
   * Create a notification for a new service request
   */
  async notifyNewServiceRequest(params: {
    requestId: string;
    requestTitle: string;
    clientId: string;
    category: string;
    providerIds: string[];
  }) {
    const { requestId, requestTitle, clientId, category, providerIds } = params;

    // Create notifications for all matching providers
    const notifications = await Promise.all(
      providerIds.map(providerId =>
        this.createNotification({
          userId: providerId,
          type: 'NEW_SERVICE_REQUEST',
          title: 'New Service Request',
          message: `A new service request in ${category} has been posted: ${requestTitle}`,
          data: {
            requestId,
            clientId,
            category
          }
        })
      )
    );

    return notifications;
  },

  /**
   * Create a notification for a transaction status change
   */
  async notifyTransactionStatusChange(params: {
    transactionId: string;
    status: string;
    requestTitle: string;
    clientId: string;
    providerId: string;
    actorId: string;
    actorName: string;
  }) {
    const { transactionId, status, requestTitle, clientId, providerId, actorId, actorName } = params;

    // Determine the recipient (the user who didn't trigger the status change)
    const recipientId = actorId === clientId ? providerId : clientId;

    let title = '';
    let message = '';

    switch (status) {
      case 'IN_PROGRESS':
        title = 'Transaction Started';
        message = `${actorName} has made payment and started the transaction for: ${requestTitle}`;
        break;
      case 'COMPLETED':
        title = 'Transaction Completed';
        message = `${actorName} has marked the transaction as completed for: ${requestTitle}`;
        break;
      case 'CANCELLED':
        title = 'Transaction Cancelled';
        message = `${actorName} has cancelled the transaction for: ${requestTitle}`;
        break;
      default:
        title = 'Transaction Updated';
        message = `${actorName} has updated the transaction status to ${status} for: ${requestTitle}`;
    }

    return await this.createNotification({
      userId: recipientId,
      type: `TRANSACTION_${status}`,
      title,
      message,
      data: {
        transactionId,
        status,
        clientId,
        providerId
      }
    });
  },

  /**
   * Create a notification for a new review
   */
  async notifyNewReview(params: {
    transactionId: string;
    requestTitle: string;
    reviewerId: string;
    reviewerName: string;
    recipientId: string;
    rating: number;
  }) {
    const { transactionId, requestTitle, reviewerId, reviewerName, recipientId, rating } = params;

    return await this.createNotification({
      userId: recipientId,
      type: 'NEW_REVIEW',
      title: 'New Review Received',
      message: `${reviewerName} has left a ${rating}-star review for: ${requestTitle}`,
      data: {
        transactionId,
        reviewerId,
        rating
      }
    });
  }
};

export default notificationService;
