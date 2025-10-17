import { PrismaClient, TransactionStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionRepository {
  /**
   * Create Transaction
   * @returns
   */
  static async createTransaction({
    user_id,
    wallet_id,
    booking_id,
    type,
    amount,
    status = TransactionStatus.PENDING,
    description,
    reference_id,
  }: {
    user_id: string;
    wallet_id?: string;
    booking_id?: string;
    type: TransactionType;
    amount: number;
    status?: TransactionStatus;
    description?: string;
    reference_id?: string;
  }) {
    const data: any = {};

    if (user_id) data['user_id'] = user_id;
    if (wallet_id) data['wallet_id'] = wallet_id;
    if (booking_id) data['booking_id'] = booking_id;
    if (type) data['type'] = type;
    if (amount) data['amount'] = amount;
    if (status) data['status'] = status;
    if (description) data['description'] = description;
    if (reference_id) data['reference_id'] = reference_id;

    return await prisma.transaction.create({
      data,
    });
  }

  /*
  * create many transactions
  * @returns
  */
  static async createManyTransactions(data: {
    user_id: string;
    wallet_id?: string;
    booking_id?: string;
    type: TransactionType;
    amount: number;
    status?: TransactionStatus;
    description?: string;
    reference_id?: string;
  }[]) {
    const dataArray = data.map((item) => {
      const data: any = {};
      if (item.user_id) data['user_id'] = item.user_id;
      if (item.wallet_id) data['wallet_id'] = item.wallet_id;
      if (item.booking_id) data['booking_id'] = item.booking_id;
      if (item.type) data['type'] = item.type;
      if (item.amount) data['amount'] = item.amount;
        if (item.status) data['status'] = item.status;
      if (item.description) data['description'] = item.description;
      if (item.reference_id) data['reference_id'] = item.reference_id;
          return data;
    });

    return await prisma.transaction.createMany({
      data: dataArray,
    });
  }
  /**
   * Update Transaction by reference_id
   * @returns
   */
  static async updateTransactionByReference({
    reference_id,
    status,
    amount,
    description,
  }: {
    reference_id: string;
    status?: TransactionStatus;
    amount?: number;
    description?: string;
  }) {
    const data: any = {};
    if (status) data['status'] = status;
    if (amount) data['amount'] = amount;
    if (description) data['description'] = description;

    return await prisma.transaction.updateMany({
      where: { reference_id },
      data,
    });
  }

  /**
   * Update Transaction by ID
   * @returns
   */
  static async updateTransactionById({
    id,
    status,
    amount,
    description,
    reference_id,
  }: {
    id: string;
    status?: TransactionStatus;
    amount?: number;
    description?: string;
    reference_id?: string;
  }) {
    const data: any = {};
    if (status) data['status'] = status;
    if (amount) data['amount'] = amount;
    if (description) data['description'] = description;
    if (reference_id) data['reference_id'] = reference_id;
    return await prisma.transaction.update({
      where: { id },
      data,
    });
  }

  /**
   * Get all transactions by user
   */
  static async getTransactionsByUser(user_id: string, limit: number, page: number) {
    const offset = (page - 1) * limit;
    const transactions = await prisma.transaction.findMany({
      where: { user_id },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.transaction.count({ where: { user_id } });
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = offset + limit < total;
    const hasPreviousPage = offset > 0;


    return {
      success: true,
      message: 'Transactions fetched successfully',
      data: transactions,
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get single transaction by ID
   */
  static async getTransactionById(id: string) {
    return await prisma.transaction.findUnique({
      where: { id },
    });
  }
}




// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export class TransactionRepository {
//   /**
//    * Create transaction
//    * @returns
//    */
//   static async createTransaction({
//     booking_id,
//     amount,
//     currency,
//     reference_number,
//     status = 'pending',
//   }: {
//     booking_id: string;
//     amount?: number;
//     currency?: string;
//     reference_number?: string;
//     status?: string;
//   }) {
//     const data = {};
//     if (booking_id) {
//       data['booking_id'] = booking_id;
//     }
//     if (amount) {
//       data['amount'] = Number(amount);
//     }
//     if (currency) {
//       data['currency'] = currency;
//     }
//     if (reference_number) {
//       data['reference_number'] = reference_number;
//     }
//     if (status) {
//       data['status'] = status;
//     }
//     return await prisma.paymentTransaction.create({
//       data: {
//         ...data,
//       },
//     });
//   }

//   /**
//    * Update transaction
//    * @returns
//    */
//   static async updateTransaction({
//     reference_number,
//     status = 'pending',
//     paid_amount,
//     paid_currency,
//     raw_status,
//   }: {
//     reference_number: string;
//     status: string;
//     paid_amount?: number;
//     paid_currency?: string;
//     raw_status?: string;
//   }) {
//     const data = {};
//     const order_data = {};
//     if (status) {
//       data['status'] = status;
//       order_data['payment_status'] = status;
//     }
//     if (paid_amount) {
//       data['paid_amount'] = Number(paid_amount);
//       order_data['paid_amount'] = Number(paid_amount);
//     }
//     if (paid_currency) {
//       data['paid_currency'] = paid_currency;
//       order_data['paid_currency'] = paid_currency;
//     }
//     if (raw_status) {
//       data['raw_status'] = raw_status;
//       order_data['payment_raw_status'] = raw_status;
//     }

//     const paymentTransaction = await prisma.paymentTransaction.findMany({
//       where: {
//         reference_number: reference_number,
//       },
//     });

//     // update booking status
//     // if (paymentTransaction.length > 0) {
//     //   await prisma.order.update({
//     //     where: {
//     //       id: paymentTransaction[0].order_id,
//     //     },
//     //     data: {
//     //       ...order_data,
//     //     },
//     //   });
//     // }

//     return await prisma.paymentTransaction.updateMany({
//       where: {
//         reference_number: reference_number,
//       },
//       data: {
//         ...data,
//       },
//     });
//   }

//   /**
//    * Update transaction
//    * @returns
//    */
//   static async updateTransactionById({
//     id,
//     reference_number,
//     status = 'pending',
//     paid_amount,
//     paid_currency,
//     raw_status,
//   }: {
//     id: string
//     reference_number?: string;
//     status: string;
//     paid_amount?: number;
//     paid_currency?: string;
//     raw_status?: string;
//   }) {
//     const data = {};
//     const order_data = {};
//     if (status) {
//       data['status'] = status;
//       order_data['payment_status'] = status;
//     }
//     if (paid_amount) {
//       data['paid_amount'] = Number(paid_amount);
//       order_data['paid_amount'] = Number(paid_amount);
//     }
//     if (paid_currency) {
//       data['paid_currency'] = paid_currency;
//       order_data['paid_currency'] = paid_currency;
//     }
//     if (raw_status) {
//       data['raw_status'] = raw_status;
//       order_data['payment_raw_status'] = raw_status;
//     }

//     const paymentTransaction = await prisma.paymentTransaction.findMany({
//       where: {
//         reference_number: reference_number,
//       },
//     });

//     // update booking status
//     // if (paymentTransaction.length > 0) {
//     //   await prisma.order.update({
//     //     where: {
//     //       id: paymentTransaction[0].order_id,
//     //     },
//     //     data: {
//     //       ...order_data,
//     //     },
//     //   });
//     // }

//     return await prisma.paymentTransaction.updateMany({
//       where: {
//         id: id,
//       },
//       data: {
//         ...data,
//       },
//     });
//   }
// }
